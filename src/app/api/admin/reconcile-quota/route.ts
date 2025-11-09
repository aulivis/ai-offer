import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import {
  recalculateUsageFromPdfs,
  countSuccessfulPdfs,
  recalculateDeviceUsageFromPdfs,
} from '@/lib/services/usage';
import { currentMonthStart } from '@/lib/services/usage';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

/**
 * Admin endpoint to reconcile quota discrepancies.
 *
 * This endpoint compares usage_counters.offers_generated with the actual
 * count of successful PDFs (offers with pdf_url IS NOT NULL) and fixes
 * any discrepancies.
 *
 * Query params:
 * - userId: Optional user ID to reconcile (if not provided, reconciles all users)
 * - periodStart: Optional period start date (defaults to current month)
 * - dryRun: If true, only reports discrepancies without fixing them
 * - includeDevices: If true, also reconciles device usage counters
 */
export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const periodStart = searchParams.get('periodStart') || undefined;
    const dryRun = searchParams.get('dryRun') === 'true';
    const includeDevices = searchParams.get('includeDevices') === 'true';

    log.info('Starting quota reconciliation', {
      userId,
      periodStart,
      dryRun,
      includeDevices,
    });

    const sb = supabaseServiceRole();
    const { iso: defaultPeriod } = currentMonthStart();
    const normalizedPeriod = periodStart || defaultPeriod;

    const results: Array<{
      userId: string;
      periodStart: string;
      counterValue: number;
      actualPdfCount: number;
      discrepancy: number;
      fixed: boolean;
      error?: string;
      deviceResults?: Array<{
        deviceId: string;
        counterValue: number;
        actualPdfCount: number;
        discrepancy: number;
        fixed: boolean;
        error?: string;
      }>;
    }> = [];

    if (userId) {
      // Reconcile single user
      try {
        const { data: counter } = await sb
          .from('usage_counters')
          .select('offers_generated, period_start')
          .eq('user_id', userId)
          .eq('period_start', normalizedPeriod)
          .maybeSingle();

        const counterValue = counter ? Number(counter.offers_generated ?? 0) : 0;
        const actualPdfCount = await countSuccessfulPdfs(sb, userId, normalizedPeriod);
        const discrepancy = actualPdfCount - counterValue;

        log.info('User quota reconciliation check', {
          userId,
          periodStart: normalizedPeriod,
          counterValue,
          actualPdfCount,
          discrepancy,
        });

        const deviceResults: Array<{
          deviceId: string;
          counterValue: number;
          actualPdfCount: number;
          discrepancy: number;
          fixed: boolean;
          error?: string;
        }> = [];

        if (includeDevices) {
          // Get all device counters for this user
          const { data: deviceCounters } = await sb
            .from('device_usage_counters')
            .select('device_id, offers_generated')
            .eq('user_id', userId)
            .eq('period_start', normalizedPeriod);

          if (deviceCounters) {
            for (const deviceCounter of deviceCounters) {
              try {
                const deviceId = deviceCounter.device_id;
                const deviceCounterValue = Number(deviceCounter.offers_generated ?? 0);

                // Count actual PDFs for this device by joining offers with pdf_jobs
                const { data: deviceOffers } = await sb
                  .from('offers')
                  .select('id')
                  .eq('user_id', userId)
                  .not('pdf_url', 'is', null)
                  .gte('created_at', `${normalizedPeriod}T00:00:00Z`)
                  .lt('created_at', `${normalizedPeriod}T23:59:59Z`);

                // Filter by device ID from pdf_jobs
                let deviceActualCount = 0;
                if (deviceOffers && deviceOffers.length > 0) {
                  const offerIds = deviceOffers.map((o) => o.id);
                  const { data: deviceJobs } = await sb
                    .from('pdf_jobs')
                    .select('offer_id')
                    .in('offer_id', offerIds)
                    .eq('user_id', userId)
                    .eq('status', 'completed')
                    .not('payload->>deviceId', 'is', null)
                    .eq('payload->>deviceId', deviceId);

                  deviceActualCount = deviceJobs?.length ?? 0;
                }
                const deviceDiscrepancy = deviceActualCount - deviceCounterValue;

                if (deviceDiscrepancy !== 0) {
                  if (!dryRun) {
                    const deviceResult = await recalculateDeviceUsageFromPdfs(
                      sb,
                      userId,
                      deviceId,
                      normalizedPeriod,
                    );
                    deviceResults.push({
                      deviceId,
                      counterValue: deviceCounterValue,
                      actualPdfCount: deviceActualCount,
                      discrepancy: deviceDiscrepancy,
                      fixed: deviceResult.updated,
                    });
                  } else {
                    deviceResults.push({
                      deviceId,
                      counterValue: deviceCounterValue,
                      actualPdfCount: deviceActualCount,
                      discrepancy: deviceDiscrepancy,
                      fixed: false,
                    });
                  }
                }
              } catch (deviceError) {
                deviceResults.push({
                  deviceId: deviceCounter.device_id,
                  counterValue: Number(deviceCounter.offers_generated ?? 0),
                  actualPdfCount: 0,
                  discrepancy: 0,
                  fixed: false,
                  error: deviceError instanceof Error ? deviceError.message : String(deviceError),
                });
              }
            }
          }
        }

        if (discrepancy !== 0 || deviceResults.length > 0) {
          if (!dryRun && discrepancy !== 0) {
            const result = await recalculateUsageFromPdfs(sb, userId, normalizedPeriod);
            results.push({
              userId,
              periodStart: normalizedPeriod,
              counterValue,
              actualPdfCount,
              discrepancy,
              fixed: result.updated,
              ...(deviceResults.length > 0 ? { deviceResults } : {}),
            });

            log.info('User quota reconciled', {
              userId,
              oldCount: result.oldCount,
              newCount: result.newCount,
              updated: result.updated,
            });
          } else {
            results.push({
              userId,
              periodStart: normalizedPeriod,
              counterValue,
              actualPdfCount,
              discrepancy,
              fixed: false,
              ...(deviceResults.length > 0 ? { deviceResults } : {}),
            });
          }
        }
      } catch (error) {
        results.push({
          userId,
          periodStart: normalizedPeriod,
          counterValue: 0,
          actualPdfCount: 0,
          discrepancy: 0,
          fixed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Reconcile all users
      const { data: counters, error: countersError } = await sb
        .from('usage_counters')
        .select('user_id, offers_generated, period_start')
        .eq('period_start', normalizedPeriod);

      if (countersError) {
        return NextResponse.json(
          { error: `Failed to load usage counters: ${countersError.message}` },
          { status: 500 },
        );
      }

      const userIds = new Set<string>();
      if (counters) {
        for (const counter of counters) {
          if (counter.user_id) {
            userIds.add(counter.user_id);
          }
        }
      }

      // Also check for users with PDFs but no counter
      const { data: offersWithPdfs } = await sb
        .from('offers')
        .select('user_id')
        .not('pdf_url', 'is', null)
        .gte('created_at', `${normalizedPeriod}T00:00:00Z`)
        .lt('created_at', `${normalizedPeriod}T23:59:59Z`);

      if (offersWithPdfs) {
        for (const offer of offersWithPdfs) {
          if (offer.user_id) {
            userIds.add(offer.user_id);
          }
        }
      }

      for (const uid of userIds) {
        try {
          const { data: counter } = await sb
            .from('usage_counters')
            .select('offers_generated, period_start')
            .eq('user_id', uid)
            .eq('period_start', normalizedPeriod)
            .maybeSingle();

          const counterValue = counter ? Number(counter.offers_generated ?? 0) : 0;
          const actualPdfCount = await countSuccessfulPdfs(sb, uid, normalizedPeriod);
          const discrepancy = actualPdfCount - counterValue;

          if (discrepancy !== 0) {
            if (!dryRun) {
              const result = await recalculateUsageFromPdfs(sb, uid, normalizedPeriod);
              results.push({
                userId: uid,
                periodStart: normalizedPeriod,
                counterValue,
                actualPdfCount,
                discrepancy,
                fixed: result.updated,
              });

              if (result.updated) {
                log.info('User quota reconciled (bulk)', {
                  userId: uid,
                  oldCount: result.oldCount,
                  newCount: result.newCount,
                });
              }
            } else {
              results.push({
                userId: uid,
                periodStart: normalizedPeriod,
                counterValue,
                actualPdfCount,
                discrepancy,
                fixed: false,
              });
            }
          }
        } catch (error) {
          results.push({
            userId: uid,
            periodStart: normalizedPeriod,
            counterValue: 0,
            actualPdfCount: 0,
            discrepancy: 0,
            fixed: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const summary = {
      totalChecked: results.length,
      discrepanciesFound: results.filter((r) => r.discrepancy !== 0).length,
      fixed: results.filter((r) => r.fixed).length,
      errors: results.filter((r) => r.error).length,
      dryRun,
      periodStart: normalizedPeriod,
    };

    log.info('Quota reconciliation completed', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
