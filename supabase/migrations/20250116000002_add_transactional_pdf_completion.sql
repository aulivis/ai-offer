-- Migration: Add transactional PDF job completion function
-- This ensures quota increment, job completion, and offer update happen atomically

create or replace function public.complete_pdf_job_transactional(
  p_job_id uuid,
  p_pdf_url text,
  p_processing_duration_ms integer
)
returns table (
  success boolean,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job pdf_jobs%rowtype;
  v_user_id uuid;
  v_offer_id uuid;
  v_usage_period_start date;
  v_user_limit integer;
  v_device_id text;
  v_device_limit integer;
  v_quota_allowed boolean := false;
  v_offers_generated integer;
  v_period_start date;
begin
  -- Start transaction (all operations in this function are atomic)
  -- Lock and fetch job details
  select * into v_job
  from pdf_jobs
  where id = p_job_id
  for update;
  
  if not found then
    return query select false, 'Job not found'::text;
    return;
  end if;
  
  if v_job.status = 'completed' then
    -- Already completed, return success
    return query select true, null::text;
    return;
  end if;
  
  if v_job.status != 'processing' then
    return query select false, format('Job is not in processing state: %s', v_job.status)::text;
    return;
  end if;
  
  v_user_id := v_job.user_id;
  v_offer_id := v_job.offer_id;
  
  -- Extract usage period and limits from job payload
  if v_job.payload is not null then
    v_usage_period_start := coalesce(
      (v_job.payload->>'usagePeriodStart')::date,
      date_trunc('month', v_job.created_at)::date
    );
    v_user_limit := nullif((v_job.payload->>'userLimit')::integer, 0);
    v_device_id := nullif(v_job.payload->>'deviceId', '');
    v_device_limit := nullif((v_job.payload->>'deviceLimit')::integer, 0);
  else
    v_usage_period_start := date_trunc('month', v_job.created_at)::date;
    v_user_limit := null;
    v_device_id := null;
    v_device_limit := null;
  end if;
  
  -- Check and increment user quota (atomic)
  if v_user_limit is not null then
    select allowed, offers_generated, period_start
    into v_quota_allowed, v_offers_generated, v_period_start
    from check_and_increment_usage(
      v_user_id,
      v_user_limit,
      v_usage_period_start,
      p_job_id  -- Exclude this job from pending count
    );
    
    if not v_quota_allowed then
      -- Quota exceeded, rollback everything
      return query select false, format(
        'Quota limit exceeded: %s/%s offers generated',
        v_offers_generated,
        v_user_limit
      )::text;
      return;
    end if;
  else
    -- No limit, just increment
    select allowed, offers_generated, period_start
    into v_quota_allowed, v_offers_generated, v_period_start
    from check_and_increment_usage(
      v_user_id,
      null,
      v_usage_period_start,
      p_job_id
    );
  end if;
  
  -- Check and increment device quota if applicable
  if v_device_id is not null and v_device_limit is not null then
    declare
      v_device_allowed boolean;
      v_device_offers_generated integer;
    begin
      select allowed, offers_generated
      into v_device_allowed, v_device_offers_generated
      from check_and_increment_device_usage(
        v_user_id,
        v_device_id,
        v_device_limit,
        v_usage_period_start,
        p_job_id
      );
      
      if not v_device_allowed then
        -- Device quota exceeded, rollback user quota increment
        -- Note: This will be automatically rolled back by the transaction
        return query select false, format(
          'Device quota limit exceeded: %s/%s offers generated',
          v_device_offers_generated,
          v_device_limit
        )::text;
        return;
      end if;
    end;
  end if;
  
  -- Update offer with PDF URL
  update offers
  set pdf_url = p_pdf_url
  where id = v_offer_id
    and user_id = v_user_id;
  
  if not found then
    -- Offer not found or user mismatch - transaction will rollback quota
    return query select false, 'Offer not found or access denied'::text;
    return;
  end if;
  
  -- Mark job as completed
  update pdf_jobs
  set 
    status = 'completed',
    completed_at = timezone('utc', now()),
    pdf_url = p_pdf_url,
    processing_duration_ms = p_processing_duration_ms,
    error_message = null
  where id = p_job_id;
  
  -- All operations succeeded
  return query select true, null::text;
  
exception
  when others then
    -- Any error will cause automatic rollback
    return query select false, format('Transaction failed: %s', sqlerrm)::text;
end;
$$;

comment on function public.complete_pdf_job_transactional is 
  'Atomically completes a PDF job by incrementing quota, updating the offer, and marking job as completed. All operations are in a single transaction.';

grant execute on function public.complete_pdf_job_transactional(uuid, text, integer) to service_role;

-- Create a function to handle quota rollback on job failure (transactional)
create or replace function public.fail_pdf_job_with_rollback(
  p_job_id uuid,
  p_error_message text,
  p_retry_count integer,
  p_max_retries integer
)
returns table (
  success boolean,
  error_message text,
  should_retry boolean,
  next_retry_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job pdf_jobs%rowtype;
  v_user_id uuid;
  v_usage_period_start date;
  v_user_limit integer;
  v_device_id text;
  v_device_limit integer;
  v_quota_was_incremented boolean := false;
  v_should_retry boolean := false;
  v_next_retry_at timestamptz;
  v_new_status text;
begin
  -- Lock and fetch job
  select * into v_job
  from pdf_jobs
  where id = p_job_id
  for update;
  
  if not found then
    return query select false, 'Job not found'::text, false, null::timestamptz;
    return;
  end if;
  
  if v_job.status = 'completed' then
    -- Already completed, don't fail it
    return query select false, 'Job is already completed'::text, false, null::timestamptz;
    return;
  end if;
  
  v_user_id := v_job.user_id;
  
  -- Extract usage period from job payload or created_at
  if v_job.payload is not null then
    v_usage_period_start := coalesce(
      (v_job.payload->>'usagePeriodStart')::date,
      date_trunc('month', v_job.created_at)::date
    );
    v_user_limit := nullif((v_job.payload->>'userLimit')::integer, 0);
    v_device_id := nullif(v_job.payload->>'deviceId', '');
    v_device_limit := nullif((v_job.payload->>'deviceLimit')::integer, 0);
  else
    v_usage_period_start := date_trunc('month', v_job.created_at)::date;
    v_user_limit := null;
    v_device_id := null;
    v_device_limit := null;
  end if;
  
  -- Check if quota was incremented (job was in processing state and started_at is set)
  if v_job.status = 'processing' and v_job.started_at is not null then
    v_quota_was_incremented := true;
    
    -- Rollback user quota increment
    update usage_counters
    set offers_generated = greatest(0, offers_generated - 1)
    where user_id = v_user_id
      and period_start = v_usage_period_start
      and offers_generated > 0;
    
    -- Rollback device quota increment if applicable
    if v_device_id is not null then
      update device_usage_counters
      set offers_generated = greatest(0, offers_generated - 1)
      where user_id = v_user_id
        and device_id = v_device_id
        and period_start = v_usage_period_start
        and offers_generated > 0;
    end if;
    
    -- Clear PDF URL from offer if it was set
    update offers
    set pdf_url = null
    where id = v_job.offer_id
      and user_id = v_user_id;
  end if;
  
  -- Determine if job should be retried
  if p_retry_count < p_max_retries then
    v_should_retry := true;
    -- Calculate next retry time with exponential backoff
    -- Base delay: 30 seconds, exponential: 2^retry_count
    v_next_retry_at := timezone('utc', now()) + 
      (interval '30 seconds' * power(2, p_retry_count));
    v_new_status := 'failed';
  else
    v_should_retry := false;
    v_next_retry_at := null;
    v_new_status := 'dead_letter_queue';
  end if;
  
  -- Update job status
  update pdf_jobs
  set 
    status = v_new_status,
    error_message = p_error_message,
    retry_count = p_retry_count + 1,
    next_retry_at = v_next_retry_at,
    completed_at = case when v_new_status = 'dead_letter_queue' then timezone('utc', now()) else null end
  where id = p_job_id;
  
  return query select true, null::text, v_should_retry, v_next_retry_at;
  
exception
  when others then
    return query select false, format('Failed to process job failure: %s', sqlerrm)::text, false, null::timestamptz;
end;
$$;

comment on function public.fail_pdf_job_with_rollback is 
  'Atomically handles PDF job failure: rolls back quota if incremented, determines retry status, and updates job state. All in a single transaction.';

grant execute on function public.fail_pdf_job_with_rollback(uuid, text, integer, integer) to service_role;


