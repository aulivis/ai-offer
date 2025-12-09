-- Migration: Add retry and Dead Letter Queue support to pdf_jobs table
-- This enables automatic retry logic with exponential backoff and DLQ for permanently failed jobs

-- 1. Add retry tracking columns
alter table public.pdf_jobs
  add column if not exists retry_count integer not null default 0,
  add column if not exists max_retries integer not null default 3,
  add column if not exists next_retry_at timestamptz,
  add column if not exists last_retry_error text,
  add column if not exists priority integer not null default 0, -- Higher priority = processed first
  add column if not exists processing_duration_ms integer, -- Track how long processing took
  add column if not exists first_attempted_at timestamptz; -- Track when first processing attempt started

-- 2. Update status constraint to include 'dead_letter' status
alter table public.pdf_jobs
  drop constraint if exists pdf_jobs_status_check;

alter table public.pdf_jobs
  add constraint pdf_jobs_status_check
  check (status in ('pending', 'processing', 'completed', 'failed', 'dead_letter'));

-- 3. Add index for retry scheduling (find jobs ready to retry)
create index if not exists idx_pdf_jobs_retry_scheduling
  on public.pdf_jobs(status, next_retry_at)
  where status = 'failed' and next_retry_at is not null;

-- 4. Add index for priority-based job selection (higher priority first, then FIFO)
create index if not exists idx_pdf_jobs_priority_pending
  on public.pdf_jobs(priority desc, created_at asc)
  where status = 'pending';

-- 5. Add index for stuck job detection (jobs in processing state for too long)
create index if not exists idx_pdf_jobs_stuck_detection
  on public.pdf_jobs(status, started_at)
  where status = 'processing' and started_at is not null;

-- 6. Add index for monitoring metrics
create index if not exists idx_pdf_jobs_created_at_status
  on public.pdf_jobs(created_at, status)
  where status in ('completed', 'failed', 'dead_letter');

-- 7. Add comments for documentation
comment on column public.pdf_jobs.retry_count is 'Number of times this job has been retried after failure';
comment on column public.pdf_jobs.max_retries is 'Maximum number of retry attempts before moving to dead letter queue';
comment on column public.pdf_jobs.next_retry_at is 'Timestamp when this job should be retried next (exponential backoff)';
comment on column public.pdf_jobs.last_retry_error is 'Error message from the last failed retry attempt';
comment on column public.pdf_jobs.priority is 'Job priority: higher values are processed first. Pro users typically have priority > 0';
comment on column public.pdf_jobs.processing_duration_ms is 'Time taken to process the job in milliseconds';
comment on column public.pdf_jobs.first_attempted_at is 'Timestamp when the job was first attempted (used for timeout detection)';

-- 8. Create function to calculate next retry delay (exponential backoff with jitter)
create or replace function public.calculate_next_retry_delay(
  retry_count integer,
  base_delay_seconds integer default 60
) returns integer as $$
declare
  max_delay_seconds integer := 3600; -- Max 1 hour delay
  exponential_delay integer;
  jitter integer;
begin
  -- Exponential backoff: base_delay * 2^retry_count
  exponential_delay := base_delay_seconds * power(2, retry_count);
  
  -- Cap at max delay
  if exponential_delay > max_delay_seconds then
    exponential_delay := max_delay_seconds;
  end if;
  
  -- Add jitter: random 0-20% to prevent thundering herd
  jitter := floor(random() * exponential_delay * 0.2);
  
  return exponential_delay + jitter;
end;
$$ language plpgsql immutable;

comment on function public.calculate_next_retry_delay is 
  'Calculates next retry delay in seconds using exponential backoff with jitter. Returns delay in seconds.';

-- 9. Create function to move jobs to dead letter queue
create or replace function public.move_job_to_dead_letter_queue(
  job_id uuid,
  reason text
) returns void as $$
begin
  update public.pdf_jobs
  set 
    status = 'dead_letter',
    error_message = coalesce(error_message || E'\n\nDLQ: ' || reason, reason),
    completed_at = timezone('utc', now()),
    next_retry_at = null -- Clear retry schedule
  where id = job_id;
  
  if not found then
    raise exception 'Job % not found', job_id;
  end if;
end;
$$ language plpgsql security definer;

comment on function public.move_job_to_dead_letter_queue is 
  'Moves a failed job to the dead letter queue after all retries are exhausted.';

-- 10. Create function to get jobs ready for retry
create or replace function public.get_jobs_ready_for_retry(
  limit_count integer default 10
) returns table (
  id uuid,
  user_id uuid,
  offer_id uuid,
  retry_count integer,
  max_retries integer,
  payload jsonb,
  storage_path text,
  callback_url text,
  download_token text
) as $$
begin
  return query
  select 
    pj.id,
    pj.user_id,
    pj.offer_id,
    pj.retry_count,
    pj.max_retries,
    pj.payload,
    pj.storage_path,
    pj.callback_url,
    pj.download_token
  from public.pdf_jobs pj
  where 
    pj.status = 'failed'
    and pj.retry_count < pj.max_retries
    and pj.next_retry_at is not null
    and pj.next_retry_at <= timezone('utc', now())
  order by pj.priority desc, pj.created_at asc
  limit limit_count
  for update skip locked; -- Prevent multiple workers from picking same job
end;
$$ language plpgsql security definer;

comment on function public.get_jobs_ready_for_retry is 
  'Returns jobs that are ready to be retried (failed status, retry count < max, next_retry_at in past).';

-- 11. Create function to get stuck jobs (processing for too long)
create or replace function public.get_stuck_jobs(
  timeout_minutes integer default 10
) returns table (
  id uuid,
  user_id uuid,
  offer_id uuid,
  started_at timestamptz,
  stuck_minutes integer
) as $$
begin
  return query
  select 
    pj.id,
    pj.user_id,
    pj.offer_id,
    pj.started_at,
    extract(epoch from (timezone('utc', now()) - pj.started_at)) / 60::integer as stuck_minutes
  from public.pdf_jobs pj
  where 
    pj.status = 'processing'
    and pj.started_at is not null
    and pj.started_at < timezone('utc', now()) - (timeout_minutes || ' minutes')::interval
  order by pj.started_at asc;
end;
$$ language plpgsql security definer;

comment on function public.get_stuck_jobs is 
  'Returns jobs that have been in processing state for longer than timeout_minutes (likely crashed/stuck).';

-- 12. Grant necessary permissions
grant execute on function public.calculate_next_retry_delay to authenticated, service_role;
grant execute on function public.move_job_to_dead_letter_queue to service_role;
grant execute on function public.get_jobs_ready_for_retry to service_role;
grant execute on function public.get_stuck_jobs to service_role;

-- 13. Add RLS policy for dead letter queue (admin access only, but visible to user for transparency)
-- Users can view their own dead letter jobs (for transparency, but typically handled by admin)
-- Service role can view all for monitoring/admin purposes





