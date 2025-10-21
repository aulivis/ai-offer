create table if not exists public.device_usage_counters (
  device_id text primary key,
  period_start date not null,
  offers_generated integer not null default 0,
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create or replace function public.set_device_usage_counters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_device_usage_counters_updated_at on public.device_usage_counters;
create trigger set_device_usage_counters_updated_at
before update on public.device_usage_counters
for each row
execute function public.set_device_usage_counters_updated_at();

alter table public.device_usage_counters enable row level security;

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
    returning * into v_usage;
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
  returning offers_generated, period_start
   into offers_generated, period_start;

  allowed := true;
  return;
end;
$$;
