-- Ensure offers table has proper RLS policies for authenticated users
-- This ensures users can read, insert, and update their own offers

-- Enable RLS if not already enabled
alter table public.offers enable row level security;

-- Policy for users to select their own offers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can select their own offers'
  ) then
    create policy "Users can select their own offers"
      on public.offers
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Policy for users to insert their own offers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can insert their own offers'
  ) then
    create policy "Users can insert their own offers"
      on public.offers
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Policy for users to update their own offers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can update their own offers'
  ) then
    create policy "Users can update their own offers"
      on public.offers
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Policy for users to delete their own offers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offers'
      and policyname = 'Users can delete their own offers'
  ) then
    create policy "Users can delete their own offers"
      on public.offers
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Ensure service_role has full access
grant all on table public.offers to service_role;













