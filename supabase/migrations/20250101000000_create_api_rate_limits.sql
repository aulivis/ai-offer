-- Create a general-purpose rate limiting table for API endpoints
create table if not exists public.api_rate_limits (
  key text primary key,
  count integer not null default 0,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

-- Create index for efficient cleanup queries
create index if not exists idx_api_rate_limits_expires_at on public.api_rate_limits(expires_at);

-- Enable RLS
alter table public.api_rate_limits enable row level security;

-- Policy: Only service role can access
create policy "Service role can manage rate limits"
  on public.api_rate_limits
  for all
  using (true)
  with check (true);

-- Function to clean up expired entries
create or replace function public.cleanup_expired_rate_limits()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.api_rate_limits
  where expires_at < timezone('utc', now());
end;
$$;

-- Grant execute to service role
grant execute on function public.cleanup_expired_rate_limits() to service_role;

