-- Fix check_and_increment_usage to account for pending/processing jobs
-- This ensures the increment function uses the same logic as check_quota_with_pending
-- When incrementing, we check: confirmed + pending < limit
-- Note: The current job being processed is included in pending count, which is correct
-- because we're about to convert it from pending to confirmed

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

  -- Count pending AND processing jobs for this user and period
  -- These represent jobs that will consume quota when they complete
  -- The current job being processed is included in this count, which is correct
  -- because we're about to increment the counter for it
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and status in ('pending', 'processing')
     and date(timezone('utc', created_at)) = p_period_start;

  -- Calculate total usage: confirmed + pending jobs
  -- Note: After increment, confirmed will be +1 and this job will move out of pending
  -- So the net effect is: confirmed + pending stays the same until job completes
  v_total := coalesce(v_usage.offers_generated, 0) + coalesce(v_pending, 0);

  -- enforce the limit when one is provided
  -- Check if total (confirmed + pending) would exceed limit
  -- If v_total >= limit, we can't increment because we'd exceed the limit
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

-- Update device quota function similarly to account for pending/processing jobs
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

  -- Count pending AND processing jobs for this device and period
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and device_id = p_device_id
     and status in ('pending', 'processing')
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

-- Grant execute permissions (in case they were lost)
grant execute on function public.check_and_increment_usage(uuid, integer, date) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date) to service_role;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to service_role;

