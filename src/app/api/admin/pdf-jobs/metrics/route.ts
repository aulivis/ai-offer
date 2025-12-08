/**
 * GET /api/admin/pdf-jobs/metrics
 *
 * Returns comprehensive metrics for PDF generation jobs.
 * Requires authentication and admin privileges.
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { getPdfJobMetrics, exportMetrics } from '@/lib/pdf/monitoring';
import { withAuth } from '@/middleware/auth';
import type { AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export const GET = withAuth(
  withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id });

    // Check admin privileges
    const { isAdmin: userIsAdmin } = await requireAdmin(req.user.id);
    if (!userIsAdmin) {
      log.warn('Non-admin user attempted to access admin metrics endpoint', {
        userId: req.user.id,
      });
      return createErrorResponse('Admin privileges required.', HttpStatus.FORBIDDEN);
    }

    const hoursParam = req.nextUrl.searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;

    if (isNaN(hours) || hours < 1 || hours > 720) {
      return createErrorResponse(
        'Invalid hours parameter. Must be between 1 and 720.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const supabase = supabaseServiceRole();
    const metrics = await getPdfJobMetrics(supabase, hours);

    // Export metrics to OpenTelemetry (if configured)
    await exportMetrics(supabase, log);

    return NextResponse.json({
      metrics,
      timestamp: new Date().toISOString(),
      hours,
    });
  }),
);
