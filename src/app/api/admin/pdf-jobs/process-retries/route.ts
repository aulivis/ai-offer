/**
 * POST /api/admin/pdf-jobs/process-retries
 *
 * Processes PDF jobs that are ready for retry.
 * This endpoint should be called periodically (e.g., via cron) to retry failed jobs.
 *
 * Query params:
 * - limit: Maximum number of jobs to process (default: 10)
 *
 * Returns: Number of jobs processed
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { getJobsReadyForRetry } from '@/lib/pdf/retry';
import { dispatchPdfJob } from '@/lib/queue/pdf';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withAuth } from '@/middleware/auth';
import type { AuthenticatedNextRequest } from '@/middleware/auth';

export const runtime = 'nodejs';

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });

  // TODO: Add admin role check here
  // For now, allow all authenticated users (add proper admin check later)

  try {
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: 'Invalid limit parameter. Must be between 1 and 100.',
        },
        { status: 400 },
      );
    }

    const supabase = supabaseServiceRole();
    const jobsReadyForRetry = await getJobsReadyForRetry(supabase, limit);

    log.info('Processing retry jobs', {
      count: jobsReadyForRetry.length,
      limit,
    });

    const processedJobs: Array<{ jobId: string; success: boolean; error?: string }> = [];

    for (const job of jobsReadyForRetry) {
      try {
        // Dispatch the job to be processed by the edge worker
        await dispatchPdfJob(supabase, job.id);
        processedJobs.push({ jobId: job.id, success: true });
        log.info('Dispatched retry job', { jobId: job.id, retryCount: job.retry_count });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        processedJobs.push({ jobId: job.id, success: false, error: errorMessage });
        log.error('Failed to dispatch retry job', error, { jobId: job.id });
      }
    }

    const successCount = processedJobs.filter((j) => j.success).length;
    const failureCount = processedJobs.filter((j) => !j.success).length;

    return NextResponse.json({
      processed: processedJobs.length,
      successful: successCount,
      failed: failureCount,
      jobs: processedJobs,
    });
  } catch (error) {
    log.error('Failed to process retry jobs', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process retries';
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
});
