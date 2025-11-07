-- Fix check_and_increment_usage to select by user_id only (since PK is user_id only)
-- The table has PRIMARY KEY (user_id), so there's only ONE row per user
-- We need to SELECT by user_id only, then check/update period_start

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
  -- lock the usage row by user_id only (since PK is user_id)
  -- There's only ONE row per user, regardless of period
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
   for update;

  -- If no row exists, create it
  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  -- Reset counter when period changes (new billing period)
  -- IMPORTANT: We already have the row locked, so we can safely check and update period
  if v_usage.period_start is distinct from p_period_start then
    -- Period changed - reset counter for new billing period
    update usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
    returning * into v_usage;
    -- After reset, v_usage.offers_generated should be 0
  end if;
  
  -- At this point, v_usage contains the correct row with correct period_start
  -- v_usage.offers_generated is the current confirmed count

  -- Count pending jobs, excluding the current job if job_id is provided
  if p_exclude_job_id is not null then
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and status = 'pending'
       and id != p_exclude_job_id
       and date(timezone('utc', created_at)) = p_period_start;
  else
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
  if v_limit is not null and v_total >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  -- increment the counter and return the updated values
  -- Update by user_id only (PK) - period_start is already set correctly above
  update usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
  returning usage_counters.offers_generated, usage_counters.period_start
   into offers_generated, period_start;
  
  -- Verify we got a result
  if offers_generated is null then
    -- This shouldn't happen, but handle it gracefully
    raise exception 'Failed to increment usage counter - update returned no rows';
  end if;

  allowed := true;
  return;
end;
$$;

-- Update device quota function similarly (device table has PK on (user_id, device_id))
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
  if p_exclude_job_id is not null then
    select count(*)
      into v_pending
      from pdf_jobs
     where user_id = p_user_id
       and device_id = p_device_id
       and status = 'pending'
       and id != p_exclude_job_id
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

-- Grant execute permissions
grant execute on function public.check_and_increment_usage(uuid, integer, date, uuid) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date, uuid) to service_role;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date, uuid) to service_role;

