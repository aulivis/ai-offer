-- Fix race condition in rate limiting by creating atomic increment function
-- This ensures rate limits cannot be bypassed under concurrent load

create or replace function public.increment_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_ms bigint
)
returns table (
  allowed boolean,
  count integer,
  expires_at timestamp with time zone,
  remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_ms bigint;
  v_expires_at timestamp with time zone;
  v_existing_count integer;
  v_existing_expires_at timestamp with time zone;
  v_new_count integer;
  v_new_expires_at timestamp with time zone;
begin
  -- Get current timestamp in milliseconds
  v_now_ms := extract(epoch from now()) * 1000;
  
  -- Lock and read existing rate limit entry
  select api_rate_limits.count, api_rate_limits.expires_at
    into v_existing_count, v_existing_expires_at
    from api_rate_limits
   where api_rate_limits.key = p_key
   for update;
  
  -- If entry doesn't exist or expired, create/reset it
  if not found or v_existing_expires_at is null or 
     extract(epoch from v_existing_expires_at) * 1000 <= v_now_ms then
    v_new_expires_at := to_timestamp((v_now_ms + p_window_ms) / 1000);
    v_new_count := 1;
    
    insert into api_rate_limits (key, count, expires_at)
    values (p_key, v_new_count, v_new_expires_at)
    on conflict (key) do update
      set count = 1,
          expires_at = v_new_expires_at;
  else
    -- Increment existing count atomically
    v_new_count := v_existing_count + 1;
    v_new_expires_at := v_existing_expires_at;
    
    update api_rate_limits
       set count = v_new_count
     where key = p_key
       and expires_at = v_existing_expires_at; -- Optimistic locking
  end if;
  
  -- Return result
  allowed := v_new_count <= p_max_requests;
  count := v_new_count;
  expires_at := v_new_expires_at;
  remaining := greatest(0, p_max_requests - v_new_count);
  
  return next;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.increment_rate_limit(text, integer, bigint) to authenticated;
grant execute on function public.increment_rate_limit(text, integer, bigint) to service_role;











