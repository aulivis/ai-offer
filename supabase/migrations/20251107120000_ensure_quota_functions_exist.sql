-- Ensure quota increment functions exist and refresh schema cache
-- This migration ensures the RPC functions are properly defined and the schema cache is refreshed

-- User quota increment function
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
begin
  -- lock or initialize the usage row
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
     and period_start = p_period_start
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

  -- enforce the limit when one is provided
  if v_limit is not null and v_usage.offers_generated >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  update usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
     and period_start = p_period_start
  returning offers_generated, period_start
   into offers_generated, period_start;

  allowed := true;
  return;
end;
$$;

-- Device quota increment function
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
    returning device_usage_counters.period_start,
              device_usage_counters.offers_generated
         into v_usage.period_start,
              v_usage.offers_generated;
  end if;

  if v_limit is not null and v_usage.offers_generated >= v_limit then
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
grant execute on function public.check_and_increment_usage(uuid, integer, date) to authenticated;
grant execute on function public.check_and_increment_usage(uuid, integer, date) to service_role;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to authenticated;
grant execute on function public.check_and_increment_device_usage(uuid, text, integer, date) to service_role;

-- Refresh PostgREST schema cache
-- Note: This might fail if pgrest schema doesn't exist (Supabase handles this differently)
-- But it's safe to try
do $$
begin
  -- Try to reload schema cache if the function exists
  if exists (
    select 1 from pg_proc 
    where proname = 'schema_cache_reload' 
    and pronamespace = (select oid from pg_namespace where nspname = 'pgrest')
  ) then
    perform pgrest.schema_cache_reload();
  end if;
exception
  when others then
    -- Ignore errors - schema cache reload is handled by Supabase
    null;
end
$$;

