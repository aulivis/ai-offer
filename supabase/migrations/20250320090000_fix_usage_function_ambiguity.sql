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
  select *
    into v_usage
    from usage_counters
   where user_id = p_user_id
   for update;

  if not found then
    insert into usage_counters (user_id, period_start, offers_generated)
    values (p_user_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  if v_usage.period_start is distinct from p_period_start then
    update usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where user_id = p_user_id
    returning usage_counters.period_start,
              usage_counters.offers_generated
         into v_usage.period_start,
              v_usage.offers_generated;
  end if;

  if v_limit is not null and v_usage.offers_generated >= v_limit then
    allowed := false;
    offers_generated := v_usage.offers_generated;
    period_start := v_usage.period_start;
    return;
  end if;

  update usage_counters
     set offers_generated = v_usage.offers_generated + 1
   where user_id = p_user_id
  returning usage_counters.offers_generated,
            usage_counters.period_start
     into offers_generated,
          period_start;

  allowed := true;
  return;
end;
$$;

create or replace function public.check_and_increment_device_usage(
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
   where device_id = p_device_id
   for update;

  if not found then
    insert into device_usage_counters (device_id, period_start, offers_generated)
    values (p_device_id, p_period_start, 0)
    returning * into v_usage;
  end if;

  if v_usage.period_start is distinct from p_period_start then
    update device_usage_counters
       set period_start = p_period_start,
           offers_generated = 0
     where device_id = p_device_id
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
   where device_id = p_device_id
  returning device_usage_counters.offers_generated,
            device_usage_counters.period_start
     into offers_generated,
          period_start;

  allowed := true;
  return;
end;
$$;
