create table if not exists public.usage_counters (
  user_id uuid primary key references auth.users (id) on delete cascade,
  period_start date not null,
  offers_generated integer not null default 0,
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create or replace function public.set_usage_counters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_usage_counters_updated_at on public.usage_counters;
create trigger set_usage_counters_updated_at
before update on public.usage_counters
for each row
execute function public.set_usage_counters_updated_at();

alter table public.usage_counters enable row level security;

-- Ensure any pre-existing rows retain valid timestamps after adding the trigger.
update public.usage_counters
   set updated_at = timezone('utc', now())
 where updated_at is null;

-- Allow authenticated users to work with their own usage row.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_counters'
      and policyname = 'Users can read their own usage counters'
  ) then
    create policy "Users can read their own usage counters"
      on public.usage_counters
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_counters'
      and policyname = 'Users can insert their own usage counters'
  ) then
    create policy "Users can insert their own usage counters"
      on public.usage_counters
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_counters'
      and policyname = 'Users can update their own usage counters'
  ) then
    create policy "Users can update their own usage counters"
      on public.usage_counters
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Allow the service role to perform maintenance tasks across all rows.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_counters'
      and policyname = 'Service role has full access to usage counters'
  ) then
    create policy "Service role has full access to usage counters"
      on public.usage_counters
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- Refresh the schema cache so PostgREST exposes the table immediately.
perform pgrest.schema_cache_reload();
