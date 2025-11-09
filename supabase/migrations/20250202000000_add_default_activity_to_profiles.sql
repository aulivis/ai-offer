-- Add default_activity_id column to profiles table
alter table public.profiles
  add column if not exists default_activity_id text;

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

