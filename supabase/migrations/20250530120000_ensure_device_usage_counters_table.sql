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
