-- Migration: Fix offer share trigger to bypass RLS
-- The trigger function needs to be able to insert into offer_shares
-- even when RLS is enabled. Since it's security definer, we need to ensure
-- the function owner has the necessary privileges.

-- Grant necessary privileges to allow the security definer function to insert shares
-- The function owner (typically postgres) needs INSERT privilege on offer_shares
do $$
begin
  -- Grant insert privilege on offer_shares to postgres role (function owner)
  -- This allows the security definer function to insert shares bypassing RLS
  if exists (select 1 from pg_roles where rolname = 'postgres') then
    grant insert on table public.offer_shares to postgres;
  end if;
  
  -- Also ensure authenticated users can execute the trigger function
  grant execute on function public.handle_new_offer_share() to authenticated;
  grant execute on function public.generate_share_token() to authenticated;
end
$$;

-- Update the trigger function with better error handling
-- The function is security definer, so it runs with the privileges of the function owner
-- If the owner has INSERT privilege, RLS will be bypassed
create or replace function public.handle_new_offer_share()
returns trigger as $$
declare
  v_share_token text;
  v_share_id uuid;
begin
  -- Generate secure token for the default share link
  v_share_token := public.generate_share_token();
  
  -- Create default share link (permanent, no expiration)
  -- This insert will bypass RLS because the function is security definer
  -- and the function owner (postgres) has INSERT privilege
  insert into public.offer_shares (
    offer_id,
    user_id,
    token,
    expires_at,
    is_active,
    access_count,
    created_at,
    updated_at
  ) values (
    new.id,
    new.user_id,
    v_share_token,
    null, -- No expiration by default
    true, -- Active by default
    0,
    timezone('utc', now()),
    timezone('utc', now())
  )
  returning id into v_share_id;
  
  return new;
exception
  when others then
    -- Log the error but don't fail the offer creation
    -- This ensures offers can still be created even if share link creation fails
    raise warning 'Failed to create default share link for offer %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_offer_share() is 'Trigger function that automatically creates a default share link when a new offer is created. Uses security definer to bypass RLS.';

