-- Fix check_quota_with_pending to SELECT by user_id only (since PK is user_id only)
-- This is the same fix as check_and_increment_usage - the table has PRIMARY KEY (user_id),
-- so we must SELECT by user_id only, then handle period reset if needed
--
-- CRITICAL ISSUE: The function was selecting by user_id AND period_start, which would fail
-- to find the row if the period_start didn't match, leading to incorrect quota checks.
--
-- This ensures consistency with check_and_increment_usage and prevents quota check failures.

create or replace function public.check_quota_with_pending(
  p_user_id uuid,
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
  v_usage usage_counters%rowtype;
  v_confirmed integer;
  v_pending integer;
  v_total integer;
begin
  -- Lock and get usage row by user_id only (since PK is user_id)
  -- There's only ONE row per user, regardless of period
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
   for update;
  
  -- If no usage counter exists, initialize it
  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    on conflict (user_id) do update
      set period_start = p_period_start,
          offers_generated = case 
            when usage_counters.period_start is distinct from p_period_start then 0
            else usage_counters.offers_generated
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
      update usage_counters
         set period_start = p_period_start,
             offers_generated = 0
       where user_id = p_user_id
      returning * into v_usage;
      v_confirmed := 0;
    else
      -- Period matches - use existing counter value
      v_confirmed := coalesce(v_usage.offers_generated, 0);
    end if;
  end if;
  
  -- Count 'pending' + 'processing' jobs for display purposes
  -- This shows all in-flight work that will consume quota when completed
  -- Note: This is different from check_and_increment_usage which excludes the current job
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
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

-- Fix check_device_quota_with_pending similarly
-- Device table has PRIMARY KEY (user_id, device_id), so we select by PK only
-- and handle period reset if needed
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
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and device_id = p_device_id
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

-- Also fix get_quota_snapshot to SELECT by user_id only for consistency
-- This is a read-only function for display, but should use the same SELECT logic
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

  -- Determine period start
  if p_period_start is null then
    -- Use first day of current month
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
  -- SELECT by user_id only (PK), not user_id + period_start
  -- If period doesn't match, the row might be from a previous period
  -- For display purposes, we show the value for the requested period
  select uc.offers_generated, uc.period_start
  into v_confirmed, v_stored_period_start
  from usage_counters uc
  where uc.user_id = v_user_id;

  -- If no row exists or period doesn't match, confirmed is 0
  if not found or v_stored_period_start is distinct from v_period_start then
    v_confirmed := 0;
  else
    v_confirmed := coalesce(v_confirmed, 0);
  end if;

  -- Count 'pending' + 'processing' jobs for display purposes
  select count(*)
  into v_pending_user
  from pdf_jobs pj
  where pj.user_id = v_user_id
    and pj.status in ('pending', 'processing')
    and date(timezone('utc', pj.created_at)) = v_period_start;

  -- Get device quota if device_id is provided
  if p_device_id is not null then
    -- Get confirmed device usage (read-only)
    -- SELECT by user_id + device_id (PK), not including period_start
    select duc.offers_generated, duc.period_start
    into v_confirmed_device, v_stored_period_start
    from device_usage_counters duc
    where duc.user_id = v_user_id
      and duc.device_id = p_device_id;

    -- If no row exists or period doesn't match, confirmed is 0
    if not found or v_stored_period_start is distinct from v_period_start then
      v_confirmed_device := 0;
    else
      v_confirmed_device := coalesce(v_confirmed_device, 0);
    end if;

    -- Count 'pending' + 'processing' jobs for device (for display)
    select count(*)
    into v_pending_device
    from pdf_jobs pj2
    where pj2.user_id = v_user_id
      and pj2.device_id = p_device_id
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
  plan := v_plan;
  quota_limit := v_limit;
  confirmed := coalesce(v_confirmed, 0);
  pending_user := coalesce(v_pending_user, 0);
  pending_device := v_pending_device;
  confirmed_device := v_confirmed_device;
  remaining := v_remaining;
  period_start := v_period_start;

  return next;
end;
$$;

-- Grant execute permissions
grant execute on function public.check_quota_with_pending(uuid, integer, date) to authenticated;
grant execute on function public.check_quota_with_pending(uuid, integer, date) to service_role;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to authenticated;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to service_role;
grant execute on function public.get_quota_snapshot(date, text) to authenticated;

