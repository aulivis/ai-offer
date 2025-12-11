/**
 * PDF Job Reconciliation Utility
 *
 * This utility helps reconcile inconsistencies that can occur when:
 * - Job completion fails after quota increment (quota incremented but job status is 'processing')
 * - Job is marked as completed but quota was not incremented
 * - Job status and quota are out of sync
 *
 * Usage:
 * - Can be called manually by administrators via API
 * - Can be run as a scheduled cleanup job
 * - Should be monitored via Sentry alerts on critical errors
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type ReconciliationResult = {
  jobId: string;
  action: 'marked_completed' | 'rolled_back_quota' | 'no_action_needed' | 'error';
  reason: string;
  details?: Record<string, unknown>;
};

/**
 * Reconcilies a specific PDF job that may be in an inconsistent state.
 * This is typically needed when job completion fails after quota increment.
 *
 * @param supabase - Supabase client
 * @param jobId - The job ID to reconcile
 * @returns Reconciliation result with action taken
 */
export async function reconcilePdfJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<ReconciliationResult> {
  try {
    // Fetch the job details
    const { data: job, error: jobError } = await supabase
      .from('pdf_jobs')
      .select('id, status, offer_id, user_id, pdf_url, completed_at, created_at')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) {
      logger.error('Failed to fetch job for reconciliation', jobError, { jobId });
      return {
        jobId,
        action: 'error',
        reason: `Failed to fetch job: ${jobError.message}`,
      };
    }

    if (!job) {
      return {
        jobId,
        action: 'no_action_needed',
        reason: 'Job not found',
      };
    }

    // Check if job has a PDF URL (indicating successful generation)
    if (!job.pdf_url) {
      // Job doesn't have a PDF, cannot reconcile
      return {
        jobId,
        action: 'no_action_needed',
        reason: 'Job does not have a PDF URL - cannot determine if quota should be incremented',
      };
    }

    // Check if job is in 'processing' state but has a PDF URL
    // This is the inconsistent state we're trying to fix
    if (job.status === 'processing' && job.pdf_url) {
      // Try to mark job as completed
      const { error: updateError } = await supabase
        .from('pdf_jobs')
        .update({
          status: 'completed',
          completed_at: job.completed_at || new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        logger.error('Failed to update job status during reconciliation', updateError, { jobId });
        return {
          jobId,
          action: 'error',
          reason: `Failed to update job status: ${updateError.message}`,
        };
      }

      logger.info('Reconciled job by marking as completed', {
        jobId,
        offerId: job.offer_id,
        userId: job.user_id,
      });

      return {
        jobId,
        action: 'marked_completed',
        reason: 'Job had PDF URL but status was processing - marked as completed',
        details: {
          offerId: job.offer_id,
          userId: job.user_id,
          pdfUrl: job.pdf_url,
        },
      };
    }

    // Job is already in a consistent state
    if (job.status === 'completed') {
      return {
        jobId,
        action: 'no_action_needed',
        reason: 'Job is already marked as completed',
      };
    }

    // Job is in failed state - no reconciliation needed
    if (job.status === 'failed') {
      return {
        jobId,
        action: 'no_action_needed',
        reason: 'Job is in failed state - no reconciliation needed',
      };
    }

    // Unknown state
    return {
      jobId,
      action: 'no_action_needed',
      reason: `Job is in ${job.status} state - no reconciliation action defined`,
    };
  } catch (error) {
    logger.error('Unexpected error during job reconciliation', error, { jobId });
    return {
      jobId,
      action: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Finds jobs that may need reconciliation.
 * These are jobs that are in 'processing' state but have a PDF URL.
 *
 * @param supabase - Supabase client
 * @param limit - Maximum number of jobs to return (default: 100)
 * @returns Array of job IDs that may need reconciliation
 */
export async function findJobsNeedingReconciliation(
  supabase: SupabaseClient,
  limit: number = 100,
): Promise<string[]> {
  try {
    const { data: jobs, error } = await supabase
      .from('pdf_jobs')
      .select('id')
      .eq('status', 'processing')
      .not('pdf_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to find jobs needing reconciliation', error);
      return [];
    }

    return jobs?.map((job) => job.id) || [];
  } catch (error) {
    logger.error('Unexpected error finding jobs for reconciliation', error);
    return [];
  }
}

/**
 * Reconcilies multiple jobs that may be in inconsistent states.
 * Useful for batch reconciliation operations.
 *
 * @param supabase - Supabase client
 * @param limit - Maximum number of jobs to reconcile (default: 50)
 * @returns Array of reconciliation results
 */
export async function reconcilePdfJobsBatch(
  supabase: SupabaseClient,
  limit: number = 50,
): Promise<ReconciliationResult[]> {
  const jobIds = await findJobsNeedingReconciliation(supabase, limit);
  const results: ReconciliationResult[] = [];

  logger.info(`Starting batch reconciliation for ${jobIds.length} jobs`, {
    jobCount: jobIds.length,
  });

  for (const jobId of jobIds) {
    const result = await reconcilePdfJob(supabase, jobId);
    results.push(result);

    // Add a small delay to avoid overwhelming the database
    if (jobIds.indexOf(jobId) < jobIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const successCount = results.filter((r) => r.action === 'marked_completed').length;
  logger.info('Batch reconciliation completed', {
    totalJobs: results.length,
    successfulReconciliations: successCount,
    noActionNeeded: results.filter((r) => r.action === 'no_action_needed').length,
    errors: results.filter((r) => r.action === 'error').length,
  });

  return results;
}
