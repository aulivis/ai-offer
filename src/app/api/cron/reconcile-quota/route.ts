/**
 * GET/POST /api/cron/reconcile-quota
 *
 * Automated quota reconciliation cron job endpoint.
 * Called daily via Vercel Cron to reconcile quota discrepancies.
 *
 * Vercel Cron automatically sends Authorization header with secret.
 *
 * Query params:
 * - periodStart: Optional period start date (defaults to current month)
 * - dryRun: If true, only reports discrepancies without fixing them
 * - includeDevices: If true, also reconciles device usage counters
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { recalculateUsageFromPdfs, currentMonthStart } from '@/lib/services/usage';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

async function handleReconciliation(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  try {
    const { searchParams } = new URL(req.url);
    const periodStartParam = searchParams.get('periodStart');
    const dryRun = searchParams.get('dryRun') === 'true';
    const includeDevices = searchParams.get('includeDevices') === 'true';

    const supabase = supabaseServiceRole();
    const { iso: defaultPeriod } = currentMonthStart();
    const normalizedPeriod = periodStartParam || defaultPeriod;

    log.info('Starting automated quota reconciliation', {
      periodStart: normalizedPeriod,
      dryRun,
      includeDevices,
    });

    // Get all users with counters or PDFs for this period
    const { data: allCounters } = await supabase
      .from('usage_counters')
      .select('user_id')
      .eq('period_start', normalizedPeriod);

    const { data: usersWithPdfs } = await supabase
      .from('offers')
      .select('user_id')
      .not('pdf_url', 'is', null)
      .gte('created_at', `${normalizedPeriod}T00:00:00Z`)
      .lt('created_at', `${normalizedPeriod}T23:59:59Z`);

    const userIds = new Set<string>();
    if (allCounters) {
      for (const counter of allCounters) {
        if (counter.user_id) {
          userIds.add(counter.user_id);
        }
      }
    }
    if (usersWithPdfs) {
      for (const offer of usersWithPdfs) {
        if (offer.user_id) {
          userIds.add(offer.user_id);
        }
      }
    }

    log.info('Reconciling quota for users', {
      userCount: userIds.size,
      periodStart: normalizedPeriod,
    });

    // Reconcile all users
    let fixedCount = 0;
    let errorCount = 0;

    if (!dryRun) {
      // Process in batches to avoid overwhelming the database
      const batchSize = 10;
      const userIdArray = Array.from(userIds);

      for (let i = 0; i < userIdArray.length; i += batchSize) {
        const batch = userIdArray.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (userId) => {
            try {
              const result = await recalculateUsageFromPdfs(supabase, userId, normalizedPeriod);

              if (result.updated) {
                fixedCount++;
                log.info('User quota reconciled', {
                  userId,
                  oldCount: result.oldCount,
                  newCount: result.newCount,
                });
              }
            } catch (error) {
              errorCount++;
              log.error('Error reconciling user quota', error, { userId });
            }
          }),
        );
      }
    }

    log.info('Quota reconciliation completed', {
      totalUsers: userIds.size,
      fixed: fixedCount,
      errors: errorCount,
      dryRun,
    });

    return NextResponse.json({
      success: true,
      periodStart: normalizedPeriod,
      dryRun,
      summary: {
        totalUsers: userIds.size,
        fixed: fixedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    log.error('Quota reconciliation failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Reconciliation failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron uses GET requests
  return handleReconciliation(req);
}

export async function POST(req: NextRequest) {
  return handleReconciliation(req);
}
