/**
 * PDF Job Retry Logic
 *
 * Handles automatic retry of failed PDF generation jobs with exponential backoff.
 * Jobs are retried up to max_retries times before being moved to the Dead Letter Queue.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelaySeconds: number;
  maxDelaySeconds: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelaySeconds: 60, // 1 minute
  maxDelaySeconds: 3600, // 1 hour
};

/**
 * Calculates the next retry delay using exponential backoff with jitter
 */
export function calculateRetryDelay(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  // Exponential backoff: base_delay * 2^retry_count
  let delay = config.baseDelaySeconds * Math.pow(2, retryCount);

  // Cap at max delay
  if (delay > config.maxDelaySeconds) {
    delay = config.maxDelaySeconds;
  }

  // Add jitter: random 0-20% to prevent thundering herd
  const jitter = Math.floor(Math.random() * delay * 0.2);

  return delay + jitter;
}

/**
 * Calculates the timestamp when the next retry should happen
 */
export function calculateNextRetryAt(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Date {
  const delaySeconds = calculateRetryDelay(retryCount, config);
  const nextRetryAt = new Date();
  nextRetryAt.setSeconds(nextRetryAt.getSeconds() + delaySeconds);
  return nextRetryAt;
}

/**
 * Marks a PDF job as failed and schedules it for retry (if retries remain)
 * or moves it to Dead Letter Queue if max retries exceeded
 */
export async function handleJobFailure(
  supabase: SupabaseClient,
  jobId: string,
  error: Error | string,
  retryCount: number,
  maxRetries: number,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const newRetryCount = retryCount + 1;

  log.warn('PDF job failed, handling retry logic', {
    jobId,
    retryCount: newRetryCount,
    maxRetries,
    error: errorMessage,
  });

  if (newRetryCount >= maxRetries) {
    // Move to Dead Letter Queue
    log.error('PDF job exceeded max retries, moving to Dead Letter Queue', {
      jobId,
      retryCount: newRetryCount,
      maxRetries,
      error: errorMessage,
    });

    const { error: dlqError } = await supabase.rpc('move_job_to_dead_letter_queue', {
      job_id: jobId,
      reason: `Exceeded max retries (${newRetryCount}/${maxRetries}). Last error: ${errorMessage}`,
    });

    if (dlqError) {
      log.error('Failed to move job to Dead Letter Queue', dlqError, {
        jobId,
        dlqError: dlqError.message,
      });
      // Fallback: Update directly
      await supabase
        .from('pdf_jobs')
        .update({
          status: 'dead_letter',
          error_message: `Exceeded max retries. Last error: ${errorMessage}`,
          completed_at: new Date().toISOString(),
          next_retry_at: null,
        })
        .eq('id', jobId);
    }

    // Report to Sentry for monitoring
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(new Error(`PDF job moved to DLQ: ${errorMessage}`), {
          level: 'error',
          tags: {
            errorType: 'pdf_job_dlq',
            component: 'pdfRetry',
            jobId,
            retryCount: newRetryCount,
          },
          contexts: {
            pdfJob: {
              jobId,
              retryCount: newRetryCount,
              maxRetries,
              error: errorMessage,
            },
          },
        });
      });
    }
  } else {
    // Schedule retry
    const nextRetryAt = calculateNextRetryAt(newRetryCount);
    const delaySeconds = Math.floor((nextRetryAt.getTime() - Date.now()) / 1000);

    log.info('Scheduling PDF job retry', {
      jobId,
      retryCount: newRetryCount,
      maxRetries,
      nextRetryAt: nextRetryAt.toISOString(),
      delaySeconds,
    });

    const { error: retryError } = await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt.toISOString(),
        last_retry_error: errorMessage,
        started_at: null, // Reset started_at so job can be picked up again
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (retryError) {
      log.error('Failed to schedule job retry', retryError, {
        jobId,
        retryError: retryError.message,
      });
      throw new Error(`Failed to schedule retry: ${retryError.message}`);
    }
  }
}

/**
 * Checks if a job should be retried based on error type
 * Some errors should not be retried (e.g., validation errors)
 */
export function isRetryableError(error: Error | string): boolean {
  const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();

  // Non-retryable errors (permanent failures)
  const nonRetryablePatterns = [
    'invalid',
    'validation',
    'permission denied',
    'quota exceeded',
    'unauthorized',
    'forbidden',
    'not found',
    'malformed',
    'bad request',
  ];

  for (const pattern of nonRetryablePatterns) {
    if (errorMessage.includes(pattern)) {
      return false;
    }
  }

  // Retryable errors (transient failures)
  return true;
}

/**
 * Gets jobs that are ready to be retried
 */
export async function getJobsReadyForRetry(
  supabase: SupabaseClient,
  limit: number = 10,
): Promise<
  Array<{
    id: string;
    user_id: string;
    offer_id: string;
    retry_count: number;
    max_retries: number;
    payload: unknown;
    storage_path: string;
    callback_url: string | null;
    download_token: string;
  }>
> {
  const { data, error } = await supabase.rpc('get_jobs_ready_for_retry', {
    limit_count: limit,
  });

  if (error) {
    throw new Error(`Failed to get jobs ready for retry: ${error.message}`);
  }

  return (data || []) as Array<{
    id: string;
    user_id: string;
    offer_id: string;
    retry_count: number;
    max_retries: number;
    payload: unknown;
    storage_path: string;
    callback_url: string | null;
    download_token: string;
  }>;
}

/**
 * Gets stuck jobs (in processing state for too long)
 */
export async function getStuckJobs(
  supabase: SupabaseClient,
  timeoutMinutes: number = 10,
): Promise<
  Array<{
    id: string;
    user_id: string;
    offer_id: string;
    started_at: string;
    stuck_minutes: number;
  }>
> {
  const { data, error } = await supabase.rpc('get_stuck_jobs', {
    timeout_minutes: timeoutMinutes,
  });

  if (error) {
    throw new Error(`Failed to get stuck jobs: ${error.message}`);
  }

  return (data || []) as Array<{
    id: string;
    user_id: string;
    offer_id: string;
    started_at: string;
    stuck_minutes: number;
  }>;
}

/**
 * Resets a stuck job to pending state so it can be retried
 */
export async function resetStuckJob(
  supabase: SupabaseClient,
  jobId: string,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  log.warn('Resetting stuck PDF job', { jobId });

  const { error } = await supabase
    .from('pdf_jobs')
    .update({
      status: 'failed', // Mark as failed so retry logic kicks in
      started_at: null,
      error_message: 'Job was stuck in processing state and was reset',
    })
    .eq('id', jobId);

  if (error) {
    log.error('Failed to reset stuck job', error, { jobId });
    throw new Error(`Failed to reset stuck job: ${error.message}`);
  }
}
