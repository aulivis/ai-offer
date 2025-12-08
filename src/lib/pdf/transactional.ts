/**
 * Transactional PDF Job Completion
 *
 * Provides transaction-based functions for completing and failing PDF jobs
 * with automatic quota rollback on failure.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('pdf-transactional');

export interface CompletePdfJobResult {
  success: boolean;
  error?: string;
}

export interface FailPdfJobResult {
  success: boolean;
  error?: string;
  shouldRetry: boolean;
  nextRetryAt?: string | null;
}

/**
 * Transactionally complete a PDF job.
 * This atomically:
 * 1. Checks and increments quota (if within limits)
 * 2. Updates the offer with PDF URL
 * 3. Marks the job as completed
 *
 * All operations succeed or fail together.
 */
export async function completePdfJobTransactional(
  supabase: SupabaseClient,
  jobId: string,
  pdfUrl: string,
  processingDurationMs?: number | null,
): Promise<CompletePdfJobResult> {
  try {
    const { data, error } = await supabase.rpc('complete_pdf_job_transactional', {
      p_job_id: jobId,
      p_pdf_url: pdfUrl,
      p_processing_duration_ms: processingDurationMs ?? null,
    });

    if (error) {
      logger.error('Failed to complete PDF job transactionally', error, { jobId, pdfUrl });
      return {
        success: false,
        error: error.message || 'Failed to complete PDF job',
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      logger.error('Empty result from complete_pdf_job_transactional', { jobId });
      return {
        success: false,
        error: 'Empty result from transaction',
      };
    }

    if (!result.success) {
      logger.warn('PDF job completion failed', {
        jobId,
        error: result.error_message,
      });
      return {
        success: false,
        error: result.error_message || 'Job completion failed',
      };
    }

    logger.info('PDF job completed transactionally', {
      jobId,
      pdfUrl,
      processingDurationMs,
    });

    return { success: true };
  } catch (error) {
    logger.error('Exception completing PDF job transactionally', error, { jobId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transactionally fail a PDF job with automatic quota rollback.
 * This atomically:
 * 1. Rolls back quota if it was incremented
 * 2. Clears PDF URL from offer if set
 * 3. Determines if job should be retried
 * 4. Updates job status (failed or dead_letter_queue)
 *
 * All operations succeed or fail together.
 */
export async function failPdfJobWithRollback(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
  retryCount: number,
  maxRetries: number,
): Promise<FailPdfJobResult> {
  try {
    const { data, error } = await supabase.rpc('fail_pdf_job_with_rollback', {
      p_job_id: jobId,
      p_error_message: errorMessage,
      p_retry_count: retryCount,
      p_max_retries: maxRetries,
    });

    if (error) {
      logger.error('Failed to fail PDF job transactionally', error, {
        jobId,
        errorMessage,
        retryCount,
        maxRetries,
      });
      return {
        success: false,
        error: error.message || 'Failed to process job failure',
        shouldRetry: false,
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      logger.error('Empty result from fail_pdf_job_with_rollback', { jobId });
      return {
        success: false,
        error: 'Empty result from transaction',
        shouldRetry: false,
      };
    }

    if (!result.success) {
      logger.warn('PDF job failure processing failed', {
        jobId,
        error: result.error_message,
      });
      return {
        success: false,
        error: result.error_message || 'Job failure processing failed',
        shouldRetry: false,
      };
    }

    logger.info('PDF job failed transactionally', {
      jobId,
      errorMessage,
      shouldRetry: result.should_retry,
      nextRetryAt: result.next_retry_at,
      newRetryCount: retryCount + 1,
    });

    return {
      success: true,
      shouldRetry: result.should_retry ?? false,
      nextRetryAt: result.next_retry_at ?? null,
    };
  } catch (error) {
    logger.error('Exception failing PDF job transactionally', error, { jobId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      shouldRetry: false,
    };
  }
}


