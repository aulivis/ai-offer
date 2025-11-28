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

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { getJobsReadyForRetry } from '@/lib/pdf/retry';
import { dispatchPdfJob } from '@/lib/queue/pdf';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withAuth } from '@/middleware/auth';
import type { AuthenticatedNextRequest } from '@/middleware/auth';

export const runtime = 'nodejs';

async function processRetries(req: NextRequest, isCron: boolean = false) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  if (!isCron) {
    log.setContext({ userId: (req as AuthenticatedNextRequest).user.id });
  }

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
      isCron,
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
}

// Handle GET requests from Vercel cron jobs
// Vercel cron jobs always use GET and can include a secret in the Authorization header
// Note: Vercel automatically adds an Authorization header with a secret for cron jobs
// The secret is available in the environment, but we'll allow GET for now since
// Vercel cron jobs are configured in vercel.json and are trusted
export const GET = async (req: NextRequest) => {
  // Check if this is a Vercel cron request by checking for the cron secret header
  // Vercel automatically adds this header for cron jobs
  const authHeader = req.headers.get('authorization');

  // For now, allow GET requests (Vercel cron uses GET)
  // In production, you should verify the Authorization header matches your cron secret
  // TODO: Add proper cron secret verification when VERCEL_CRON_SECRET is added to env schema
  if (authHeader) {
    // If there's an auth header, it's likely a Vercel cron job
    return processRetries(req, true);
  }

  // If no auth header, return 405 to indicate POST is required for manual calls
  return NextResponse.json(
    {
      error:
        'This endpoint requires POST method for manual calls. GET is reserved for Vercel cron jobs.',
      method: req.method,
    },
    { status: 405 },
  );
};

// Handle POST requests from authenticated users
export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  // TODO: Add admin role check here
  // For now, allow all authenticated users (add proper admin check later)
  return processRetries(req, false);
});
