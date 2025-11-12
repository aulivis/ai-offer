-- Migration: Create chatbot_analytics table for tracking chatbot usage and performance
-- This enables comprehensive analytics and monitoring of chatbot interactions

-- Create chatbot_analytics table
create table if not exists public.chatbot_analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb default '{}',
  user_ip text,
  user_agent text,
  request_id text,
  created_at timestamp with time zone not null default timezone('utc', now())
);

comment on table public.chatbot_analytics is 'Analytics events for chatbot usage, performance, and user interactions.';
comment on column public.chatbot_analytics.event_type is 'Type of event (e.g., query_processed, error, feedback, etc.).';
comment on column public.chatbot_analytics.event_data is 'JSON data associated with the event.';
comment on column public.chatbot_analytics.user_ip is 'IP address of the user (for analytics, anonymized).';
comment on column public.chatbot_analytics.user_agent is 'User agent string (for analytics).';
comment on column public.chatbot_analytics.request_id is 'Unique request identifier for tracing.';

-- Create indexes for efficient queries
create index if not exists idx_chatbot_analytics_event_type 
  on public.chatbot_analytics(event_type);

create index if not exists idx_chatbot_analytics_created_at 
  on public.chatbot_analytics(created_at);

create index if not exists idx_chatbot_analytics_request_id 
  on public.chatbot_analytics(request_id);

-- Create GIN index for JSONB event_data queries
create index if not exists idx_chatbot_analytics_event_data 
  on public.chatbot_analytics using gin (event_data);

-- Enable RLS (Row Level Security)
alter table public.chatbot_analytics enable row level security;

-- Policy: Public can insert analytics (anyone can trigger events)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_analytics'
      and policyname = 'Public can insert analytics'
  ) then
    create policy "Public can insert analytics"
      on public.chatbot_analytics
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

-- Policy: Service role can read all analytics (for dashboards and reports)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_analytics'
      and policyname = 'Service role can read analytics'
  ) then
    create policy "Service role can read analytics"
      on public.chatbot_analytics
      for select
      to service_role
      using (true);
  end if;
end
$$;







