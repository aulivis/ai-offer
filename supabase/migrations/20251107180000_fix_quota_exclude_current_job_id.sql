-- Fix quota increment to exclude the current job being processed
-- This is the correct pattern: when incrementing quota for a specific job,
-- that job should be excluded from the pending count since it's being converted to confirmed
--
-- The issue: Job is created as 'pending', then when we try to increment quota after PDF generation,
-- the job is still 'pending' (or 'processing'), so it gets counted, causing incorrect quota denial.
--
-- Solution: Add optional job_id parameter to exclude from pending count

-- Update check_and_increment_usage to accept optional job_id and exclude it from pending count
create or replace function public.check_and_increment_usage(
  p_user_id uuid,
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

  -- Count pending jobs, excluding the current job if job_id is provided
  -- This is the key fix: exclude the job being processed from the pending count
  if p_exclude_job_id is not null then
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and status = 'pending'
       and id != p_exclude_job_id  -- Exclude the current job
       and date(timezone('utc', created_at)) = p_period_start;
  else
    -- If no job_id provided, count all pending jobs (backward compatibility)
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and status = 'pending'
       and date(timezone('utc', created_at)) = p_period_start;
  end if;

  -- Calculate total usage: confirmed + pending jobs (excluding current job)
  v_total := coalesce(v_usage.offers_generated, 0) + coalesce(v_pending, 0);

  -- enforce the limit when one is provided
  -- Check if total (confirmed + pending) would exceed limit
  if v_limit is not null and v_total >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  -- increment the counter and return the updated values
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

  -- Count pending jobs, excluding the current job if job_id is provided
  if p_exclude_job_id is not null then
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and device_id = p_device_id
       and status = 'pending'
       and id != p_exclude_job_id  -- Exclude the current job
       and date(timezone('utc', created_at)) = p_period_start;
  else
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and device_id = p_device_id
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
     and period_start = p_period_start
  returning device_usage_counters.offers_generated,
            device_usage_counters.period_start
     into offers_generated,
          period_start;

  allowed := true;
  return;
end;
$$;

-- Grant execute permissions
grant execute on function public.check_and_increment_usage(uuid, integer, date, uuid) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date, uuid) to service_role;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to service_role;









