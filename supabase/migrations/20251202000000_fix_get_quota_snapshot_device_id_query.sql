-- Fix get_quota_snapshot, check_device_quota_with_pending, and check_and_increment_device_usage
-- to query deviceId from JSONB payload instead of non-existent device_id column
-- The pdf_jobs table stores deviceId in payload->>'deviceId', not as a direct column
-- This fixes the error: "column pj2.device_id does not exist"

-- Fix check_and_increment_device_usage first
create or replace function public.check_and_increment_device_usage(
  p_user_id uuid,
  p_device_id text,
  p_limit integer,
  p_period_start date,
  p_exclude_job_id uuid default null
)
returns table (
  allowed boolean,
  offers_generated integer,
  period_start date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage device_usage_counters%rowtype;
  v_limit integer := p_limit;
  v_pending integer;
  v_total integer;
begin
  -- Lock the usage row by user_id and device_id (PK is (user_id, device_id))
  -- Note: Device table doesn't include period_start in PK, so we select by PK only
  select *
    into v_usage
    from device_usage_counters
   where user_id = p_user_id
     and device_id = p_device_id
   for update;

  if not found then
    insert into device_usage_counters (user_id, device_id, period_start, offers_generated)
    values (p_user_id, p_device_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  -- Reset counter when period changes
  if v_usage.period_start is distinct from p_period_start then
    update device_usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
       and device_id = p_device_id
    returning * into v_usage;
  end if;

  -- Count pending jobs, excluding the current job if job_id is provided
  -- FIXED: Query deviceId from JSONB payload instead of non-existent device_id column
  if p_exclude_job_id is not null then
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and (payload->>'deviceId') = p_device_id
       and status = 'pending'
       and id != p_exclude_job_id
       and date(timezone('utc', created_at)) = p_period_start;
  else
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and (payload->>'deviceId') = p_device_id
       and status = 'pending'
       and date(timezone('utc', created_at)) = p_period_start;
  end if;

  v_total := coalesce(v_usage.offers_generated, 0) + coalesce(v_pending, 0);

  if v_limit is not null and v_total >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  update device_usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
     and device_id = p_device_id
  returning device_usage_counters.offers_generated,
            device_usage_counters.period_start
     into offers_generated,
          period_start;
  
  -- Verify we got a result
  if offers_generated is null then
    raise exception 'Failed to increment device usage counter - update returned no rows';
  end if;

  allowed := true;
  return;
end;
$$;

-- Fix check_device_quota_with_pending
create or replace function public.check_device_quota_with_pending(
  p_user_id uuid,
  p_device_id text,
  p_limit integer,
  p_period_start date
)
returns table (
  allowed boolean,
  confirmed_count integer,
  pending_count integer,
  total_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage device_usage_counters%rowtype;
  v_confirmed integer;
  v_pending integer;
  v_total integer;
begin
  -- Lock and get device usage row by user_id and device_id (PK is (user_id, device_id))
  -- Select by PK only, then handle period reset if needed
  select *
    into v_usage
    from device_usage_counters
   where user_id = p_user_id
     and device_id = p_device_id
   for update;
  
  -- If no device usage counter exists, initialize it
  if not found then
    insert into device_usage_counters (user_id, device_id, period_start, offers_generated)
    values (p_user_id, p_device_id, p_period_start, 0)
    on conflict (user_id, device_id) do update
      set period_start = p_period_start,
          offers_generated = case 
            when device_usage_counters.period_start is distinct from p_period_start then 0
            else device_usage_counters.offers_generated
          end
    returning * into v_usage;
    
    -- If insert/update succeeded, use the returned values
    if found then
      v_confirmed := coalesce(v_usage.offers_generated, 0);
    else
      v_confirmed := 0;
    end if;
  else
    -- Row exists - check if period changed and reset if needed
    if v_usage.period_start is distinct from p_period_start then
      -- Period changed - reset counter for new billing period
      update device_usage_counters
         set period_start = p_period_start,
             offers_generated = 0
       where user_id = p_user_id
         and device_id = p_device_id
      returning * into v_usage;
      v_confirmed := 0;
    else
      -- Period matches - use existing counter value
      v_confirmed := coalesce(v_usage.offers_generated, 0);
    end if;
  end if;
  
  -- Count 'pending' + 'processing' jobs for display purposes
  -- FIXED: Query deviceId from JSONB payload instead of non-existent device_id column
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and (payload->>'deviceId') = p_device_id
     and status in ('pending', 'processing')  -- Count all in-flight work
     and date(timezone('utc', created_at)) = p_period_start;
  
  v_total := coalesce(v_confirmed, 0) + coalesce(v_pending, 0);
  
  -- Check if total exceeds limit
  if p_limit is not null and v_total >= p_limit then
    allowed := false;
  else
    allowed := true;
  end if;
  
  confirmed_count := coalesce(v_confirmed, 0);
  pending_count := coalesce(v_pending, 0);
  total_count := v_total;
  
  return next;
end;
$$;

-- Fix get_quota_snapshot
create or replace function public.get_quota_snapshot(
  p_period_start date default null,
  p_device_id text default null
)
returns table (
  plan text,
  quota_limit integer,
  confirmed integer,
  pending_user integer,
  pending_device integer,
  confirmed_device integer,
  remaining integer,
  period_start date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period_start date;
  v_plan text;
  v_limit integer;
  v_confirmed integer;
  v_pending_user integer;
  v_pending_device integer;
  v_confirmed_device integer;
  v_total integer;
  v_remaining integer;
  v_stored_period_start date;
begin
  -- Ensure user is authenticated
  if v_user_id is null then
    raise exception 'User must be authenticated';
  end if;

  -- Determine period start (always use current month if not provided)
  if p_period_start is null then
    v_period_start := date_trunc('month', timezone('utc', now()))::date;
  else
    v_period_start := p_period_start;
  end if;

  -- Get user's plan from profile
  select coalesce(p.plan, 'free') into v_plan
  from profiles p
  where p.id = v_user_id;

  -- Determine limit based on plan
  case v_plan
    when 'pro' then
      v_limit := null; -- Unlimited
    when 'standard' then
      v_limit := 5;
    else
      v_limit := 2; -- Free plan
  end case;

  -- Get confirmed usage (read-only, no lock)
  -- CRITICAL: Select by user_id only (PK), not user_id + period_start
  -- This ensures we always find the row, then check if period matches
  select uc.offers_generated, uc.period_start
  into v_confirmed, v_stored_period_start
  from usage_counters uc
  where uc.user_id = v_user_id;

  -- If no row exists OR period doesn't match, confirmed is 0
  -- This is correct: if period changed, counter hasn't been reset yet, but for display
  -- purposes we show 0 for the new period
  if not found then
    v_confirmed := 0;
  elsif v_stored_period_start is distinct from v_period_start then
    -- Period mismatch: counter is for a different period
    -- Return 0 for confirmed (new period hasn't started counting yet)
    v_confirmed := 0;
  else
    -- Period matches: use the counter value
    v_confirmed := coalesce(v_confirmed, 0);
  end if;

  -- Count 'pending' + 'processing' jobs for display purposes
  -- This shows all in-flight work that will consume quota when completed
  select count(*)
  into v_pending_user
  from pdf_jobs pj
  where pj.user_id = v_user_id
    and pj.status in ('pending', 'processing')
    and date(timezone('utc', pj.created_at)) = v_period_start;

  -- Get device quota if device_id is provided
  if p_device_id is not null then
    -- Get confirmed device usage (read-only)
    -- Select by user_id + device_id (PK), not including period_start
    select duc.offers_generated, duc.period_start
    into v_confirmed_device, v_stored_period_start
    from device_usage_counters duc
    where duc.user_id = v_user_id
      and duc.device_id = p_device_id;

    -- If no row exists OR period doesn't match, confirmed is 0
    if not found then
      v_confirmed_device := 0;
    elsif v_stored_period_start is distinct from v_period_start then
      -- Period mismatch: counter is for a different period
      v_confirmed_device := 0;
    else
      -- Period matches: use the counter value
      v_confirmed_device := coalesce(v_confirmed_device, 0);
    end if;

    -- Count 'pending' + 'processing' jobs for device (for display)
    -- FIXED: Query deviceId from JSONB payload instead of non-existent device_id column
    select count(*)
    into v_pending_device
    from pdf_jobs pj2
    where pj2.user_id = v_user_id
      and (pj2.payload->>'deviceId') = p_device_id
      and pj2.status in ('pending', 'processing')
      and date(timezone('utc', pj2.created_at)) = v_period_start;
  else
    v_confirmed_device := null;
    v_pending_device := null;
  end if;

  -- Calculate remaining quota
  if v_limit is not null then
    v_total := coalesce(v_confirmed, 0) + coalesce(v_pending_user, 0);
    v_remaining := greatest(v_limit - v_total, 0);
  else
    v_remaining := null; -- Unlimited
  end if;

  -- Return the snapshot
  -- Always return the REQUESTED period, not the stored period
  plan := v_plan;
  quota_limit := v_limit;
  confirmed := coalesce(v_confirmed, 0);
  pending_user := coalesce(v_pending_user, 0);
  pending_device := v_pending_device;
  confirmed_device := v_confirmed_device;
  remaining := v_remaining;
  period_start := v_period_start; -- Always return requested period

  return next;
end;
$$;

-- Grant execute permissions
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to service_role;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to authenticated;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to service_role;
grant execute on function public.get_quota_snapshot(date, text) to authenticated;

