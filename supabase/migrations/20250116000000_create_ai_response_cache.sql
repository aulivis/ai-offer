-- Migration: Create AI response cache table
-- This enables caching of AI-generated content to reduce API costs and improve latency

create table if not exists public.ai_response_cache (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_hash text not null, -- Hash of the actual prompt sent to AI
  response_html text not null, -- The AI-generated HTML response
  response_blocks jsonb, -- Structured response blocks if available
  model text not null default 'gpt-4o-mini',
  token_count integer, -- Token count for cost tracking
  cached_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  access_count integer not null default 0,
  last_accessed_at timestamptz not null default timezone('utc', now())
);

comment on table public.ai_response_cache is 'Cache for AI-generated responses to reduce API costs and improve latency';

-- Indexes for efficient cache lookups
create index if not exists idx_ai_cache_request_hash on public.ai_response_cache(request_hash);
create index if not exists idx_ai_cache_user_id on public.ai_response_cache(user_id);
-- Index on expires_at for cleanup queries (removed WHERE clause - now() is not IMMUTABLE)
-- Filtering by expiration time is done in queries, not in the index predicate
create index if not exists idx_ai_cache_expires_at on public.ai_response_cache(expires_at);
create index if not exists idx_ai_cache_last_accessed on public.ai_response_cache(last_accessed_at);

-- Enable RLS
alter table public.ai_response_cache enable row level security;

-- Users can read their own cached responses
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_response_cache'
      and policyname = 'Users can read their own cached responses'
  ) then
    create policy "Users can read their own cached responses"
      on public.ai_response_cache
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Users can insert their own cached responses
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_response_cache'
      and policyname = 'Users can insert their own cached responses'
  ) then
    create policy "Users can insert their own cached responses"
      on public.ai_response_cache
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Service role can read/update/delete all (for cache management)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_response_cache'
      and policyname = 'Service role can manage all cached responses'
  ) then
    create policy "Service role can manage all cached responses"
      on public.ai_response_cache
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- Function to cleanup expired cache entries
create or replace function public.cleanup_expired_ai_cache()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_response_cache
  where expires_at < timezone('utc', now());
  
  get diagnostics deleted_count = row_count;
  
  return deleted_count;
end;
$$ language plpgsql security definer;

comment on function public.cleanup_expired_ai_cache is 
  'Deletes expired AI response cache entries. Returns count of deleted entries.';

-- Function to get or increment cache access count
create or replace function public.increment_cache_access(cache_id uuid)
returns void as $$
begin
  update public.ai_response_cache
  set 
    access_count = access_count + 1,
    last_accessed_at = timezone('utc', now())
  where id = cache_id;
end;
$$ language plpgsql security definer;

comment on function public.increment_cache_access is 
  'Increments access count and updates last accessed timestamp for a cache entry.';

-- Grant permissions
grant execute on function public.cleanup_expired_ai_cache() to service_role;
grant execute on function public.increment_cache_access(uuid) to service_role, authenticated;

