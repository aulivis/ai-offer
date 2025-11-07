-- Fix quota check to include both 'pending' and 'processing' jobs
-- This matches the countPendingPdfJobs function which counts both statuses
-- Jobs in 'processing' status should be counted as they represent in-flight work

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
  
  -- Count pending AND processing jobs atomically (within same transaction)
  -- Jobs in 'processing' status should be counted as they represent in-flight work
  -- Note: We check jobs created in the same period, accounting for timezone
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and status in ('pending', 'processing')
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

-- Update device quota function similarly
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
  
  -- Count pending AND processing jobs for this device atomically
  -- Jobs in 'processing' status should be counted as they represent in-flight work
  -- Note: We check jobs created in the same period, accounting for timezone
  select count(*)
    into v_pending
    from pdf_jobs
   where user_id = p_user_id
     and device_id = p_device_id
     and status in ('pending', 'processing')
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







