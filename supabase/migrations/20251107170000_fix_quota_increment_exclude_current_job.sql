-- Fix check_and_increment_usage to exclude the current job from pending count
-- This is the industry best practice: when incrementing quota for a specific job,
-- that job should be excluded from the pending count since it's being converted to confirmed
-- 
-- The issue: When a job is in 'processing' status (set by claimJobForInlineProcessing),
-- it's still counted as pending, causing quota to be incorrectly denied even when available.
--
-- Solution: Exclude jobs that are in 'processing' status from the pending count,
-- OR better: Only count jobs that are truly pending (not being actively processed)

create or replace function public.check_and_increment_usage(
  p_user_id uuid,
  p_limit integer,
  p_period_start date
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
  v_usage usage_counters%rowtype;
  v_limit integer := p_limit;
  v_pending integer;
  v_total integer;
begin
  -- lock or initialize the usage row
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
     and usage_counters.period_start = p_period_start
   for update;

  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  -- reset counter when a new billing period starts
  if v_usage.period_start is distinct from p_period_start then
    update usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
    returning * into v_usage;
  end if;

  -- Count ONLY 'pending' jobs (not 'processing')
  -- Jobs in 'processing' status are being actively worked on and should not be counted
  -- as pending since they're about to be converted to confirmed (or failed)
  -- This follows the industry best practice of excluding in-flight work from quota reservations
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and status = 'pending'  -- Only count truly pending jobs, not processing ones
     and date(timezone('utc', created_at)) = p_period_start;

  -- Calculate total usage: confirmed + pending jobs
  -- Note: Jobs in 'processing' status are excluded because they're being converted
  -- from pending to confirmed right now, so counting them would double-count
  v_total := coalesce(v_usage.offers_generated, 0) + coalesce(v_pending, 0);

  -- enforce the limit when one is provided
  -- Check if total (confirmed + pending) would exceed limit
  -- We allow if total < limit (strictly less than, not equal)
  if v_limit is not null and v_total >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  -- increment the counter and return the updated values
  -- Use qualified column names to avoid ambiguity with return column names
  update usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
     and usage_counters.period_start = p_period_start
  returning usage_counters.offers_generated, usage_counters.period_start
   into offers_generated, period_start;

  allowed := true;
  return;
end;
$$;

-- Update device quota function similarly
create or replace function public.check_and_increment_device_usage(
  p_user_id uuid,
  p_device_id text,
  p_limit integer,
  p_period_start date
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
  select *
    into v_usage
    from device_usage_counters
   where user_id = p_user_id
     and device_id = p_device_id
     and period_start = p_period_start
   for update;

  if not found then
    insert into device_usage_counters (user_id, device_id, period_start, offers_generated)
    values (p_user_id, p_device_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  if v_usage.period_start is distinct from p_period_start then
    update device_usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
       and device_id = p_device_id
    returning * into v_usage;
  end if;

  -- Count ONLY 'pending' jobs (not 'processing') for device quota
  -- Same logic as user quota: exclude processing jobs from pending count
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and device_id = p_device_id
     and status = 'pending'  -- Only count truly pending jobs
     and date(timezone('utc', created_at)) = p_period_start;

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
     and period_start = p_period_start
  returning device_usage_counters.offers_generated,
            device_usage_counters.period_start
     into offers_generated,
          period_start;

  allowed := true;
  return;
end;
$$;

-- Keep check_quota_with_pending counting 'pending' + 'processing' for display purposes
-- This shows all in-flight work that will consume quota
-- This is different from check_and_increment_usage which only counts 'pending'
-- (to exclude the current job being processed)
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
  v_confirmed integer;
  v_pending integer;
  v_total integer;
begin
  -- Lock and get confirmed usage
  select coalesce(offers_generated, 0)
    into v_confirmed
    from usage_counters
   where user_id = p_user_id
     and period_start = p_period_start
   for update;
  
  -- If no usage counter exists, initialize it
  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    on conflict (user_id) do nothing;
    v_confirmed := 0;
  end if;
  
  -- Count 'pending' + 'processing' jobs for display purposes
  -- This shows all in-flight work that will consume quota when completed
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and status in ('pending', 'processing')  -- Count all in-flight work
     and date(timezone('utc', created_at)) = p_period_start;
  
  v_total := v_confirmed + v_pending;
  
  -- Check if total exceeds limit
  if p_limit is not null and v_total >= p_limit then
    allowed := false;
  else
    allowed := true;
  end if;
  
  confirmed_count := v_confirmed;
  pending_count := v_pending;
  total_count := v_total;
  
  return next;
end;
$$;

-- Keep device quota check function counting 'pending' + 'processing' for display
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
  v_confirmed integer;
  v_pending integer;
  v_total integer;
begin
  -- Lock and get confirmed device usage
  select coalesce(offers_generated, 0)
    into v_confirmed
    from device_usage_counters
   where user_id = p_user_id
     and device_id = p_device_id
     and period_start = p_period_start
   for update;
  
  -- If no usage counter exists, initialize it
  if not found then
    insert into device_usage_counters (user_id, device_id, period_start, offers_generated)
    values (p_user_id, p_device_id, p_period_start, 0)
    on conflict (user_id, device_id) do nothing;
    v_confirmed := 0;
  end if;
  
  -- Count 'pending' + 'processing' jobs for display purposes
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and device_id = p_device_id
     and status in ('pending', 'processing')  -- Count all in-flight work
     and date(timezone('utc', created_at)) = p_period_start;
  
  v_total := v_confirmed + v_pending;
  
  -- Check if total exceeds limit
  if p_limit is not null and v_total >= p_limit then
    allowed := false;
  else
    allowed := true;
  end if;
  
  confirmed_count := v_confirmed;
  pending_count := v_pending;
  total_count := v_total;
  
  return next;
end;
$$;

-- Also update get_quota_snapshot to use the same logic
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
  -- Use table alias to avoid ambiguity with return column name
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
  -- Use table alias to avoid ambiguity with return column names
  select coalesce(uc.offers_generated, 0)
  into v_confirmed
  from usage_counters uc
  where uc.user_id = v_user_id
    and uc.period_start = v_period_start;

  -- Initialize to 0 if not found
  if v_confirmed is null then
    v_confirmed := 0;
  end if;

  -- Count 'pending' + 'processing' jobs for display purposes
  -- This shows all in-flight work that will consume quota when completed
  -- Note: This is different from check_and_increment_usage which only counts 'pending'
  -- to exclude the current job being processed
  select count(*)
  into v_pending_user
  from pdf_jobs pj
  where pj.user_id = v_user_id
    and pj.status in ('pending', 'processing')  -- Count all in-flight work
    and date(timezone('utc', pj.created_at)) = v_period_start;

  -- Get device quota if device_id is provided
  if p_device_id is not null then
    -- Get confirmed device usage (read-only)
    -- Use table alias to avoid ambiguity with return column names
    select coalesce(duc.offers_generated, 0)
    into v_confirmed_device
    from device_usage_counters duc
    where duc.user_id = v_user_id
      and duc.device_id = p_device_id
      and duc.period_start = v_period_start;

    -- Initialize to 0 if not found
    if v_confirmed_device is null then
      v_confirmed_device := 0;
    end if;

    -- Count 'pending' + 'processing' jobs for device (for display)
    select count(*)
    into v_pending_device
    from pdf_jobs pj2
    where pj2.user_id = v_user_id
      and pj2.device_id = p_device_id
      and pj2.status in ('pending', 'processing')  -- Count all in-flight work
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

-- Grant execute permissions (in case they were lost)
grant execute on function public.check_and_increment_usage(uuid, integer, date) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date) to service_role;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to service_role;
grant execute on function public.check_quota_with_pending(uuid, integer, date) to authenticated;
grant execute on function public.check_quota_with_pending(uuid, integer, date) to service_role;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to authenticated;
grant execute on function public.check_device_quota_with_pending(uuid, text, integer, date) to service_role;
grant execute on function public.get_quota_snapshot(date, text) to authenticated;

