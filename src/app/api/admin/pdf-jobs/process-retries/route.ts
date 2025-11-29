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
import { requireAdmin } from '@/lib/admin';
import { envServer } from '@/env.server';

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
export const GET = async (req: NextRequest) => {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  // Check if this is a Vercel cron request by verifying the cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = envServer.VERCEL_CRON_SECRET;

  if (authHeader && cronSecret) {
    // Verify the Authorization header matches the expected cron secret
    // Vercel sends: Authorization: Bearer <secret>
    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader === expectedAuth) {
      log.info('Verified Vercel cron request');
      return processRetries(req, true);
    } else {
      log.warn('Invalid cron secret in Authorization header', {
        hasAuthHeader: !!authHeader,
        headerLength: authHeader?.length ?? 0,
      });
      return NextResponse.json({ error: 'Invalid cron secret.' }, { status: 403 });
    }
  } else if (authHeader && !cronSecret) {
    // If auth header is present but no secret is configured, allow it (backward compatibility)
    // This allows existing cron jobs to continue working while secret is being configured
    log.warn('Cron request received but VERCEL_CRON_SECRET not configured', {
      hasAuthHeader: !!authHeader,
    });
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
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });

  // Check admin privileges
  const { isAdmin: userIsAdmin } = await requireAdmin(req.user.id);
  if (!userIsAdmin) {
    log.warn('Non-admin user attempted to process retry jobs', {
      userId: req.user.id,
    });
    return NextResponse.json({ error: 'Admin privileges required.' }, { status: 403 });
  }

  return processRetries(req, false);
});
