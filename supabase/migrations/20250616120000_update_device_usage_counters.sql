-- Ensure each device usage row is associated with the owning user and tighten
-- access controls so tenants can only read or modify their own counters.

-- Add the new foreign key column if it doesn't exist yet.  The subsequent
-- constraints will mark it as NOT NULL, but we first add it as nullable to make
-- backfilling possible.
alter table public.device_usage_counters
  add column if not exists user_id uuid;

-- Populate the new column from known ownership data.  PDF jobs persist the
-- originating device identifier in their payload alongside the user id, which
-- lets us reconstruct the relationship.
with latest_jobs as (
  select distinct on (payload->>'deviceId')
         payload->>'deviceId' as device_id,
         user_id
    from public.pdf_jobs
   where payload->>'deviceId' is not null
   order by payload->>'deviceId', coalesce(completed_at, created_at) desc, created_at desc
)
update public.device_usage_counters as duc
   set user_id = latest_jobs.user_id
  from latest_jobs
 where duc.user_id is null
   and duc.device_id = latest_jobs.device_id;

-- Remove any counters that still lack an owner after the backfill.  These rows
-- cannot satisfy the forthcoming NOT NULL constraint and are orphaned without a
-- clear tenant relationship.
delete from public.device_usage_counters
 where user_id is null;

-- Ensure timestamps remain valid after the structural changes.
update public.device_usage_counters
   set updated_at = timezone('utc', now())
 where updated_at is null;

-- Replace the single-column primary key with a composite one and enforce the
-- foreign key relationship to auth.users.
alter table public.device_usage_counters
  drop constraint if exists device_usage_counters_pkey;

alter table public.device_usage_counters
  alter column user_id set not null;

alter table public.device_usage_counters
  add constraint device_usage_counters_pkey primary key (user_id, device_id);

alter table public.device_usage_counters
  drop constraint if exists device_usage_counters_user_id_fkey;

alter table public.device_usage_counters
  add constraint device_usage_counters_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

create index if not exists device_usage_counters_device_idx on public.device_usage_counters (device_id);

-- Refresh the quota RPC so it requires the owning user id as part of the
-- signature and enforces per-tenant isolation.
drop function if exists public.check_and_increment_device_usage(text, integer, date);

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
  returning device_usage_counters.offers_generated,
            device_usage_counters.period_start
     into offers_generated,
          period_start;

  allowed := true;
  return;
end;
$$;

-- Ensure tenants can only see and mutate their own device rows while the worker
-- (service role) retains unrestricted access.
do $$
begin
  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'device_usage_counters'
       and policyname = 'Users can read their own device usage counters'
  ) then
    create policy "Users can read their own device usage counters"
      on public.device_usage_counters
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'device_usage_counters'
       and policyname = 'Users can insert their own device usage counters'
  ) then
    create policy "Users can insert their own device usage counters"
      on public.device_usage_counters
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'device_usage_counters'
       and policyname = 'Users can update their own device usage counters'
  ) then
    create policy "Users can update their own device usage counters"
      on public.device_usage_counters
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'device_usage_counters'
       and policyname = 'Service role has full access to device usage counters'
  ) then
    create policy "Service role has full access to device usage counters"
      on public.device_usage_counters
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'unique_user_device_period'
       and conrelid = 'public.device_usage_counters'::regclass
  ) then
    alter table public.device_usage_counters
      add constraint unique_user_device_period unique (user_id, device_id, period_start);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'device_usage_counters_offers_generated_non_negative'
       and conrelid = 'public.device_usage_counters'::regclass
  ) then
    alter table public.device_usage_counters
      add constraint device_usage_counters_offers_generated_non_negative
        check (offers_generated >= 0);
  end if;
end
$$;

select pgrest.schema_cache_reload();
