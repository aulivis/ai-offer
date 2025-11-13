-- Migration: Create offer sharing and customer response tables
-- This migration creates tables for sharing offers with customers via secure links,
-- allowing customers to view and respond to offers, with automatic notifications.

-- 1. Create offer_shares table
create table if not exists public.offer_shares (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique, -- Secure random token for URL
  expires_at timestamptz, -- Optional expiration
  is_active boolean not null default true, -- Can be revoked
  customer_email text, -- Optional: email of customer
  customer_name text, -- Optional: name of customer
  access_count integer not null default 0, -- Track views
  last_accessed_at timestamptz, -- Last access timestamp
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.offer_shares is 'Shareable links for offers that allow customers to view and respond without authentication.';

-- Indexes for offer_shares
create index if not exists offer_shares_offer_id_idx on public.offer_shares (offer_id);
create index if not exists offer_shares_token_idx on public.offer_shares (token) where is_active = true;
create index if not exists offer_shares_user_id_idx on public.offer_shares (user_id);
create index if not exists offer_shares_created_at_idx on public.offer_shares (created_at desc);

-- Updated_at trigger for offer_shares
create or replace function public.handle_offer_shares_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.offer_shares;
create trigger set_updated_at
before update on public.offer_shares
for each row
execute function public.handle_offer_shares_updated_at();

-- RLS Policies for offer_shares
alter table public.offer_shares enable row level security;

-- Users can manage their own offer shares
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_shares'
      and policyname = 'Users can manage their own offer shares'
  ) then
    create policy "Users can manage their own offer shares"
      on public.offer_shares
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Public can read active shares by token (for viewing offers)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_shares'
      and policyname = 'Public can read active shares by token'
  ) then
    create policy "Public can read active shares by token"
      on public.offer_shares
      for select
      to anon
      using (
        is_active = true 
        and (expires_at is null or expires_at > now())
      );
  end if;
end
$$;

-- Ensure service_role has full access
grant all on table public.offer_shares to service_role;

-- 2. Create offer_responses table
create table if not exists public.offer_responses (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  share_id uuid not null references public.offer_shares (id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  comment text, -- Optional customer comment
  customer_name text, -- Name provided by customer
  customer_email text, -- Email provided by customer
  ip_address text, -- For audit purposes
  user_agent text, -- For audit purposes
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.offer_responses is 'Customer responses to shared offers (accept/reject).';

-- Indexes for offer_responses
create index if not exists offer_responses_offer_id_idx on public.offer_responses (offer_id);
create index if not exists offer_responses_share_id_idx on public.offer_responses (share_id);
create index if not exists offer_responses_created_at_idx on public.offer_responses (created_at desc);

-- RLS Policies for offer_responses
alter table public.offer_responses enable row level security;

-- Users can read responses to their offers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_responses'
      and policyname = 'Users can read responses to their offers'
  ) then
    create policy "Users can read responses to their offers"
      on public.offer_responses
      for select
      to authenticated
      using (
        exists (
          select 1 from public.offers
          where offers.id = offer_responses.offer_id
          and offers.user_id = auth.uid()
        )
      );
  end if;
end
$$;

-- Public can insert responses (when responding via share link)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_responses'
      and policyname = 'Public can insert responses'
  ) then
    create policy "Public can insert responses"
      on public.offer_responses
      for insert
      to anon
      with check (
        exists (
          select 1 from public.offer_shares
          where offer_shares.id = offer_responses.share_id
          and offer_shares.is_active = true
          and (offer_shares.expires_at is null or offer_shares.expires_at > now())
        )
      );
  end if;
end
$$;

-- Ensure service_role has full access
grant all on table public.offer_responses to service_role;

-- 3. Create offer_notifications table
create table if not exists public.offer_notifications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('response', 'view', 'share_created')),
  title text not null, -- Notification title
  message text not null, -- Notification message
  metadata jsonb default '{}', -- Additional data (decision, customer name, etc.)
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.offer_notifications is 'Notifications for offer creators when customers interact with shared offers.';

-- Indexes for offer_notifications
create index if not exists offer_notifications_user_id_idx 
  on public.offer_notifications (user_id, is_read, created_at desc);
create index if not exists offer_notifications_offer_id_idx 
  on public.offer_notifications (offer_id);
create index if not exists offer_notifications_type_idx 
  on public.offer_notifications (type);
create index if not exists offer_notifications_created_at_idx 
  on public.offer_notifications (created_at desc);

-- RLS Policies for offer_notifications
alter table public.offer_notifications enable row level security;

-- Users can manage their own notifications
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_notifications'
      and policyname = 'Users can manage their own notifications'
  ) then
    create policy "Users can manage their own notifications"
      on public.offer_notifications
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Ensure service_role has full access
grant all on table public.offer_notifications to service_role;

-- 4. Create offer_share_access_logs table (for analytics)
create table if not exists public.offer_share_access_logs (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.offer_shares (id) on delete cascade,
  ip_address text,
  user_agent text,
  accessed_at timestamptz not null default timezone('utc', now())
);

comment on table public.offer_share_access_logs is 'Access logs for shared offer links (for analytics and security).';

-- Indexes for offer_share_access_logs
create index if not exists offer_share_access_logs_share_id_idx 
  on public.offer_share_access_logs (share_id);
create index if not exists offer_share_access_logs_accessed_at_idx 
  on public.offer_share_access_logs (accessed_at desc);

-- RLS Policies for offer_share_access_logs
alter table public.offer_share_access_logs enable row level security;

-- Users can read access logs for their own shares
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_share_access_logs'
      and policyname = 'Users can read access logs for their shares'
  ) then
    create policy "Users can read access logs for their shares"
      on public.offer_share_access_logs
      for select
      to authenticated
      using (
        exists (
          select 1 from public.offer_shares
          where offer_shares.id = offer_share_access_logs.share_id
          and offer_shares.user_id = auth.uid()
        )
      );
  end if;
end
$$;

-- Public can insert access logs (when accessing shared links)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_share_access_logs'
      and policyname = 'Public can insert access logs'
  ) then
    create policy "Public can insert access logs"
      on public.offer_share_access_logs
      for insert
      to anon
      with check (
        exists (
          select 1 from public.offer_shares
          where offer_shares.id = offer_share_access_logs.share_id
          and offer_shares.is_active = true
          and (offer_shares.expires_at is null or offer_shares.expires_at > now())
        )
      );
  end if;
end
$$;

-- Ensure service_role has full access
grant all on table public.offer_share_access_logs to service_role;


