-- Migration: Create chatbot_feedback table for user feedback tracking
-- This enables collecting user feedback (thumbs up/down) on chatbot responses

-- Create chatbot_feedback table
create table if not exists public.chatbot_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  feedback_type text not null check (feedback_type in ('up', 'down')),
  comment text,
  user_ip text,
  user_agent text,
  created_at timestamp with time zone not null default timezone('utc', now())
);

comment on table public.chatbot_feedback is 'User feedback on chatbot responses (thumbs up/down).';
comment on column public.chatbot_feedback.message_id is 'Unique identifier for the chatbot message.';
comment on column public.chatbot_feedback.feedback_type is 'Type of feedback: up (thumbs up) or down (thumbs down).';
comment on column public.chatbot_feedback.comment is 'Optional comment from the user.';
comment on column public.chatbot_feedback.user_ip is 'IP address of the user (for analytics, anonymized).';
comment on column public.chatbot_feedback.user_agent is 'User agent string (for analytics).';

-- Create indexes for efficient queries
create index if not exists idx_chatbot_feedback_message_id 
  on public.chatbot_feedback(message_id);

create index if not exists idx_chatbot_feedback_feedback_type 
  on public.chatbot_feedback(feedback_type);

create index if not exists idx_chatbot_feedback_created_at 
  on public.chatbot_feedback(created_at);

-- Enable RLS (Row Level Security)
alter table public.chatbot_feedback enable row level security;

-- Policy: Public can insert feedback (anyone can provide feedback)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_feedback'
      and policyname = 'Public can insert feedback'
  ) then
    create policy "Public can insert feedback"
      on public.chatbot_feedback
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

-- Policy: Service role can read all feedback (for analytics)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_feedback'
      and policyname = 'Service role can read feedback'
  ) then
    create policy "Service role can read feedback"
      on public.chatbot_feedback
      for select
      to service_role
      using (true);
  end if;
end
$$;





