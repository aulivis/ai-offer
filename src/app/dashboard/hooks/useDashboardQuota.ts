/**
 * Dashboard Quota Management Hook
 *
 * Extracted from dashboard page to improve maintainability.
 * Handles quota loading, real-time subscriptions, and quota state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { currentMonthStart } from '@/lib/utils/dateHelpers';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { createClientLogger } from '@/lib/clientLogger';

type UsageQuotaSnapshot = {
  plan: SubscriptionPlan;
  limit: number | null;
  used: number;
  pending: number;
  devicePending: number | null;
  periodStart: string | null;
};

function getDeviceIdFromCookie(name = 'propono_device_id'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const rawCookie = document.cookie;
  if (!rawCookie) {
    return null;
  }

  const parts = rawCookie.split(';');
  for (const part of parts) {
    const [cookieName, ...rest] = part.trim().split('=');
    if (cookieName === name) {
      const value = rest.join('=');
      if (!value) {
        return null;
      }
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

/**
 * Hook to manage dashboard quota state and real-time updates
 */
export function useDashboardQuota() {
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const logger = useMemo(
    () =>
      createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useDashboardQuota' }),
    [user?.id],
  );

  const [quotaSnapshot, setQuotaSnapshot] = useState<UsageQuotaSnapshot | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);

  const loadQuota = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsQuotaLoading(false);
      return;
    }

    setIsQuotaLoading(true);
    try {
      const deviceId = getDeviceIdFromCookie();
      const { getQuotaData } = await import('@/lib/services/quota');
      const quotaData = await getQuotaData(sb, deviceId, null);

      const normalizedDevicePending = deviceId
        ? (quotaData.pendingDevice ?? 0)
        : quotaData.pendingDevice;

      setQuotaSnapshot({
        plan: quotaData.plan as SubscriptionPlan,
        limit: quotaData.limit,
        used: quotaData.confirmed,
        pending: quotaData.pendingUser,
        devicePending: normalizedDevicePending,
        periodStart: quotaData.periodStart,
      });
    } catch (error) {
      logger.error('Failed to load usage quota', error);
      setQuotaSnapshot(null);
    } finally {
      setIsQuotaLoading(false);
    }
  }, [authStatus, sb, user, logger]);

  // Use ref to store latest loadQuota callback
  const loadQuotaRef = useRef(loadQuota);
  useEffect(() => {
    loadQuotaRef.current = loadQuota;
  }, [loadQuota]);

  // Load quota on mount
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsQuotaLoading(false);
      return;
    }

    loadQuotaRef.current();
  }, [authStatus, user]);

  // Set up real-time subscriptions for quota updates
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    const { iso: expectedPeriod } = currentMonthStart();

    // Debounce quota refreshes to prevent excessive calls
    let quotaRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedLoadQuota = () => {
      if (quotaRefreshTimeout) {
        clearTimeout(quotaRefreshTimeout);
      }
      quotaRefreshTimeout = setTimeout(() => {
        loadQuotaRef.current();
      }, 500);
    };

    // Subscribe to usage_counters changes
    const usageChannel = sb
      .channel(`dashboard-quota-usage-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: Usage counter updated via realtime, refreshing quota');
          }
          debouncedLoadQuota();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: Usage counter inserted via realtime, refreshing quota');
          }
          debouncedLoadQuota();
        },
      )
      .subscribe();

    // Subscribe to pdf_jobs changes
    const jobsChannel = sb
      .channel(`dashboard-quota-jobs-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: PDF job changed via realtime, refreshing quota');
          }
          debouncedLoadQuota();
        },
      )
      .subscribe();

    return () => {
      if (quotaRefreshTimeout) {
        clearTimeout(quotaRefreshTimeout);
      }
      sb.removeChannel(usageChannel);
      sb.removeChannel(jobsChannel);
    };
  }, [authStatus, user, sb, logger]);

  return {
    quotaSnapshot,
    isQuotaLoading,
    refreshQuota: loadQuota,
  };
}
