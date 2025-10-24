-- Ensure every authenticated user has a corresponding profile row.
create or replace function public.ensure_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_profile_for_new_user on auth.users;
create trigger ensure_profile_for_new_user
  after insert on auth.users
  for each row
  execute function public.ensure_profile_for_new_user();

insert into public.profiles (id)
select users.id
  from auth.users as users
 where not exists (
   select 1
     from public.profiles as profiles
    where profiles.id = users.id
 );
