-- Add default_activity_id column to profiles table
-- Handle case where column might already exist with wrong type
do $$
begin
  -- Check if column exists
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'default_activity_id'
  ) then
    -- Column exists, check if it's the wrong type
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'default_activity_id'
        and data_type = 'text'
    ) then
      -- Drop the column if it's text type (will be recreated as uuid)
      alter table public.profiles drop column default_activity_id;
    end if;
  end if;
  
  -- Add column if it doesn't exist (or was just dropped)
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'default_activity_id'
  ) then
    alter table public.profiles
      add column default_activity_id uuid;
  end if;
end $$;

-- Add foreign key constraint to activities table
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'profiles_default_activity_id_fkey'
    and table_name = 'profiles'
  ) then
    alter table public.profiles
      add constraint profiles_default_activity_id_fkey
      foreign key (default_activity_id)
      references public.activities(id)
      on delete set null;
  end if;
end $$;

