/**
 * POST /api/admin/pdf-jobs/reset-stuck
 *
 * Resets PDF jobs that are stuck in processing state (likely crashed).
 * This endpoint should be called periodically to clean up stuck jobs.
 *
 * Query params:
 * - timeoutMinutes: Minutes a job must be processing to be considered stuck (default: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { getStuckJobs, resetStuckJob } from '@/lib/pdf/retry';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withAuth } from '@/middleware/auth';
import type { AuthenticatedNextRequest } from '@/middleware/auth';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

async function resetStuckJobs(req: NextRequest, isCron: boolean = false) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  if (!isCron) {
    log.setContext({ userId: (req as AuthenticatedNextRequest).user.id });
  }

  try {
    const timeoutParam = req.nextUrl.searchParams.get('timeoutMinutes');
    const timeoutMinutes = timeoutParam ? parseInt(timeoutParam, 10) : 10;

    if (isNaN(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 1440) {
      return NextResponse.json(
        {
          error: 'Invalid timeoutMinutes parameter. Must be between 1 and 1440.',
        },
        { status: 400 },
      );
    }

    const supabase = supabaseServiceRole();
    const stuckJobs = await getStuckJobs(supabase, timeoutMinutes);

    log.warn('Found stuck PDF jobs', {
      count: stuckJobs.length,
      timeoutMinutes,
      isCron,
    });

    const resetJobs: Array<{ jobId: string; success: boolean; error?: string }> = [];

    for (const job of stuckJobs) {
      try {
        await resetStuckJob(supabase, job.id, log);
        resetJobs.push({ jobId: job.id, success: true });
        log.warn('Reset stuck job', {
          jobId: job.id,
          stuckMinutes: job.stuck_minutes,
          userId: job.user_id,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        resetJobs.push({ jobId: job.id, success: false, error: errorMessage });
        log.error('Failed to reset stuck job', error, { jobId: job.id });
      }
    }

    const successCount = resetJobs.filter((j) => j.success).length;
    const failureCount = resetJobs.filter((j) => !j.success).length;

    return NextResponse.json({
      found: stuckJobs.length,
      reset: successCount,
      failed: failureCount,
      jobs: resetJobs,
    });
  } catch (error) {
    log.error('Failed to reset stuck jobs', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset stuck jobs';
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
export const GET = async (req: NextRequest) => {
  // Check if this is a Vercel cron request by checking for the cron secret header
  const authHeader = req.headers.get('authorization');

  // If there's an auth header, it's likely a Vercel cron job
  if (authHeader) {
    return resetStuckJobs(req, true);
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
    log.warn('Non-admin user attempted to reset stuck jobs', {
      userId: req.user.id,
    });
    return NextResponse.json({ error: 'Admin privileges required.' }, { status: 403 });
  }

  return resetStuckJobs(req, false);
});
