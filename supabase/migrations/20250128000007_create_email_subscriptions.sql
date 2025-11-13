-- Create table for email subscriptions/newsletter signups
-- This table stores email addresses from landing page and footer subscription forms

create table if not exists public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null check (source in ('landing_page', 'footer', 'exit_intent', 'other')),
  subscribed_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  metadata jsonb default '{}',
  unique(email, source)
);

comment on table public.email_subscriptions is 'Email addresses collected from newsletter subscription forms on the landing page and footer.';

-- Create indexes for efficient queries
create index if not exists idx_email_subscriptions_email on public.email_subscriptions(email);
create index if not exists idx_email_subscriptions_source on public.email_subscriptions(source);
create index if not exists idx_email_subscriptions_subscribed_at on public.email_subscriptions(subscribed_at desc);
create index if not exists idx_email_subscriptions_active on public.email_subscriptions(email, source) 
  where unsubscribed_at is null;

-- Enable RLS (public can insert, but only service role can read)
alter table public.email_subscriptions enable row level security;

-- Policy: Anyone can insert email subscriptions (for public forms)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'email_subscriptions'
      and policyname = 'Public can subscribe to newsletter'
  ) then
    create policy "Public can subscribe to newsletter"
      on public.email_subscriptions
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

-- Policy: Only service role can read subscriptions (for admin/export purposes)
-- No select policy for authenticated users - subscriptions should only be accessed via admin tools
-- This prevents users from seeing other people's email addresses

-- Grant permissions
grant insert on table public.email_subscriptions to anon, authenticated;
grant usage on schema public to anon, authenticated;




