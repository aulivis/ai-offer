-- Migration: Add concurrent job limits per user for PDF generation
-- Prevents resource exhaustion by limiting concurrent processing jobs per user

-- Function to check if user has exceeded concurrent job limit
create or replace function public.check_concurrent_job_limit(
  user_id_param uuid,
  max_concurrent integer default 3
) returns boolean as $$
declare
  current_count integer;
begin
  select count(*)
  into current_count
  from public.pdf_jobs
  where user_id = user_id_param
    and status = 'processing'
    and started_at is not null;
  
  return current_count < max_concurrent;
end;
$$ language plpgsql security definer stable;

comment on function public.check_concurrent_job_limit is 
  'Checks if user has exceeded concurrent job limit. Returns true if under limit, false if at/over limit.';

-- Function to get concurrent job count for a user
create or replace function public.get_concurrent_job_count(user_id_param uuid)
returns integer as $$
declare
  job_count integer;
begin
  select count(*)
  into job_count
  from public.pdf_jobs
  where user_id = user_id_param
    and status = 'processing'
    and started_at is not null;
  
  return coalesce(job_count, 0);
end;
$$ language plpgsql security definer stable;

comment on function public.get_concurrent_job_count is 
  'Returns the number of jobs currently in processing state for a user.';

-- Grant permissions
grant execute on function public.check_concurrent_job_limit(uuid, integer) to authenticated, service_role;
grant execute on function public.get_concurrent_job_count(uuid) to authenticated, service_role;



















