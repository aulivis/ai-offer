-- Migration: Auto-create default share link for each offer
-- This migration adds a trigger that automatically creates a default share link
-- when an offer is created, making sharing easier for users.

-- Function to generate a secure random token for share links
-- PostgreSQL doesn't support base64url encoding directly, so we convert from base64
create or replace function public.generate_share_token()
returns text as $$
declare
  v_token text;
  v_exists boolean;
begin
  -- Generate token and convert base64 to base64url format
  -- Loop until we get a unique token (extremely unlikely to need more than one iteration)
  loop
    -- Generate 32 random bytes, encode as base64, then convert to base64url
    v_token := encode(gen_random_bytes(32), 'base64');
    -- Convert base64 to base64url: replace + with -, / with _, and remove padding =
    v_token := replace(replace(rtrim(v_token, '='), '+', '-'), '/', '_');
    
    -- Check if token already exists (token column has unique constraint)
    select exists(select 1 from public.offer_shares where token = v_token) into v_exists;
    
    -- If token is unique, exit loop
    if not v_exists then
      exit;
    end if;
  end loop;
  
  return v_token;
end;
$$ language plpgsql;

comment on function public.generate_share_token() is 'Generates a secure random token for share links (32 bytes, base64url encoded).';

-- Function to auto-create default share link for new offers
create or replace function public.handle_new_offer_share()
returns trigger as $$
declare
  v_share_token text;
  v_share_id uuid;
begin
  -- Generate secure token for the default share link
  v_share_token := public.generate_share_token();
  
  -- Create default share link (permanent, no expiration)
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
end;
$$ language plpgsql security definer;

comment on function public.handle_new_offer_share() is 'Trigger function that automatically creates a default share link when a new offer is created.';

-- Drop trigger if it exists
drop trigger if exists on_offer_create_share on public.offers;

-- Create trigger that fires after offer insert
create trigger on_offer_create_share
after insert on public.offers
for each row
execute function public.handle_new_offer_share();

-- Backfill: Create default share links for existing offers that don't have one
-- Only creates one default share per offer (the first one if multiple exist)
insert into public.offer_shares (
  offer_id,
  user_id,
  token,
  expires_at,
  is_active,
  access_count,
  created_at,
  updated_at
)
select 
  o.id as offer_id,
  o.user_id,
  public.generate_share_token() as token,
  null as expires_at,
  true as is_active,
  0 as access_count,
  o.created_at,
  o.created_at
from public.offers o
where not exists (
  select 1 
  from public.offer_shares os 
  where os.offer_id = o.id 
  and os.is_active = true
  and (os.expires_at is null or os.expires_at > now())
)
on conflict (token) do nothing; -- Skip if token collision (extremely unlikely, but token is unique)

