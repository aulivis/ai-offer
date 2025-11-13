-- Add user_id column to email_subscriptions table to link subscriptions to user accounts
-- This allows logged-in users to manage their email subscription preferences

-- Add user_id column (nullable for backward compatibility with existing subscriptions)
alter table public.email_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Create index for efficient queries
create index if not exists idx_email_subscriptions_user_id on public.email_subscriptions(user_id) 
  where user_id is not null;

-- Update RLS policy to allow users to view and update their own subscriptions
do $$
begin
  -- Allow users to view their own subscriptions
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'email_subscriptions'
      and policyname = 'Users can view their own subscriptions'
  ) then
    create policy "Users can view their own subscriptions"
      on public.email_subscriptions
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  -- Allow users to update their own subscriptions
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'email_subscriptions'
      and policyname = 'Users can update their own subscriptions'
  ) then
    create policy "Users can update their own subscriptions"
      on public.email_subscriptions
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Grant update permission to authenticated users
grant update on table public.email_subscriptions to authenticated;

-- Link existing subscriptions to users by email (if user exists with that email)
-- This is a best-effort migration - some subscriptions may not have matching users
update public.email_subscriptions es
set user_id = u.id
from auth.users u
where es.user_id is null
  and lower(trim(es.email)) = lower(trim(u.email))
  and es.unsubscribed_at is null;

comment on column public.email_subscriptions.user_id is 'User account ID if subscription is linked to a registered user. Null for anonymous subscriptions.';




