'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { currentMonthStart } from '@/lib/services/usage';
import { t } from '@/copy';
import { getDeviceIdFromCookie } from '@/lib/deviceId';

type UsageResponse = {
  plan: 'free' | 'standard' | 'pro';
  limit: number | null;
  confirmed: number;
  pendingUser: number;
  pendingDevice: number | null;
  confirmedDevice: number | null;
  remaining: number | null;
  periodStart: string;
};

export default function QuotaWarningBar() {
  const sb = useSupabase();
  const { status: authStatus, user } = useOptionalAuth();
  const [quotaSnapshot, setQuotaSnapshot] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for authenticated users
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    (async () => {
      try {
        const deviceId = getDeviceIdFromCookie();
        const { iso: expectedPeriod } = currentMonthStart();

        // Call database function directly - simpler and faster than API route
        const { data, error } = await sb.rpc('get_quota_snapshot', {
          p_period_start: expectedPeriod,
          p_device_id: deviceId || null,
        });

        if (!active) {
          return;
        }

        if (error) {
          // Silently handle auth errors - user is not authenticated, which is expected
          if (error.message?.includes('authenticated') || error.code === 'PGRST301') {
            setQuotaSnapshot(null);
            return;
          }
          throw new Error(`Failed to load quota: ${error.message}`);
        }

        const snapshot = Array.isArray(data) ? data[0] : data;
        if (!snapshot || !active) {
          return;
        }

        // Map database response to UsageResponse format
        const usageData: UsageResponse = {
          plan: snapshot.plan as 'free' | 'standard' | 'pro',
          limit: snapshot.limit,
          confirmed: Number(snapshot.confirmed) || 0,
          pendingUser: Number(snapshot.pending_user) || 0,
          pendingDevice: snapshot.pending_device !== null ? Number(snapshot.pending_device) || 0 : null,
          confirmedDevice: snapshot.confirmed_device !== null ? Number(snapshot.confirmed_device) || 0 : null,
          remaining: snapshot.remaining,
          periodStart: snapshot.period_start,
        };

        setQuotaSnapshot(usageData);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load quota for warning bar:', error);
        setQuotaSnapshot(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authStatus, user, sb]);

  const { isQuotaExhausted, isDeviceQuotaExhausted, warningType } = useMemo(() => {
    if (!quotaSnapshot || isLoading) {
      return { isQuotaExhausted: false, isDeviceQuotaExhausted: false, warningType: null };
    }

    const { limit, confirmed, pendingUser, pendingDevice, confirmedDevice, plan } = quotaSnapshot;

    // Check user quota exhaustion
    const userQuotaExhausted =
      limit !== null && typeof limit === 'number' && confirmed + pendingUser >= limit;

    // Check device quota exhaustion (only for free plan)
    const deviceLimit = plan === 'free' && typeof limit === 'number' ? 2 : null;
    const deviceConfirmed = confirmedDevice ?? 0;
    const devicePending = pendingDevice ?? 0;
    const deviceQuotaExhausted =
      deviceLimit !== null && deviceConfirmed + devicePending >= deviceLimit;

    // Determine warning type
    let warningType: 'both' | 'user' | 'device' | null = null;
    if (userQuotaExhausted && deviceQuotaExhausted) {
      warningType = 'both';
    } else if (userQuotaExhausted) {
      warningType = 'user';
    } else if (deviceQuotaExhausted) {
      warningType = 'device';
    }

    return {
      isQuotaExhausted: userQuotaExhausted,
      isDeviceQuotaExhausted: deviceQuotaExhausted,
      warningType,
    };
  }, [quotaSnapshot, isLoading]);

  // Don't show if quota is not exhausted
  if (!warningType || isLoading) {
    return null;
  }

  // Don't show for pro plan (unlimited)
  if (quotaSnapshot?.plan === 'pro') {
    return null;
  }

  const message =
    warningType === 'both'
      ? t('quotaWarningBar.message.both')
      : warningType === 'user'
        ? t('quotaWarningBar.message.user')
        : t('quotaWarningBar.message.device');

  const ctaLabel = t('quotaWarningBar.cta');
  const ctaHref = '/billing';

  return (
    <div
      className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-center gap-4 px-6 text-sm font-medium">
        <svg
          className="h-5 w-5 shrink-0 text-white"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span className="text-center leading-relaxed">{message}</span>
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center rounded-full border-2 border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30 hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-amber-600"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

