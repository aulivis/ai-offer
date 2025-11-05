-- Create audit logs table for tracking sensitive operations
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid not null,
  metadata jsonb default '{}',
  request_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone not null default timezone('utc', now())
);

-- Create indexes for efficient queries
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policy: Only service role can insert, no one can read (for security)
create policy "Service role can insert audit logs"
  on public.audit_logs
  for insert
  with check (true);

-- No select policy - audit logs should only be accessed through admin tools/service role

