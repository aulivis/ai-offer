'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
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

function parseUsageResponse(payload: unknown): UsageResponse | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const planValue = record.plan;
  if (planValue !== 'free' && planValue !== 'standard' && planValue !== 'pro') {
    return null;
  }

  const limit =
    record.limit === null
      ? null
      : typeof record.limit === 'number' && Number.isFinite(record.limit)
        ? record.limit
        : null;

  const confirmed = Number(record.confirmed) || 0;
  const pendingUser = Number(record.pendingUser) || 0;
  const pendingDevice =
    record.pendingDevice === null || record.pendingDevice === undefined
      ? null
      : Number(record.pendingDevice) || 0;
  const confirmedDevice =
    record.confirmedDevice === null || record.confirmedDevice === undefined
      ? null
      : Number(record.confirmedDevice) || 0;
  const periodStart = typeof record.periodStart === 'string' ? record.periodStart : '';

  if (!periodStart) {
    return null;
  }

  return {
    plan: planValue,
    limit,
    confirmed,
    pendingUser,
    pendingDevice,
    confirmedDevice,
    remaining: typeof record.remaining === 'number' ? record.remaining : null,
    periodStart,
  };
}

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
        const params = new URLSearchParams({ period_start: expectedPeriod });
        if (deviceId) {
          params.set('device_id', deviceId);
        }

        const response = await fetchWithSupabaseAuth(
          `/api/usage/with-pending?${params.toString()}`,
          { method: 'GET', defaultErrorMessage: t('errors.requestFailed') },
        );

        if (!active) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as unknown;
        const usageData = parseUsageResponse(payload);

        if (!usageData || !active) {
          return;
        }

        setQuotaSnapshot(usageData);
      } catch (error) {
        if (!active) {
          return;
        }
        // Silently handle 401 errors - user is not authenticated, which is expected
        // Only log other errors
        if (error instanceof ApiError && error.status === 401) {
          setQuotaSnapshot(null);
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
    const deviceLimit = plan === 'free' && typeof limit === 'number' ? 3 : null;
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

