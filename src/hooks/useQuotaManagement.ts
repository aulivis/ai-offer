'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { t } from '@/copy';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { getQuotaData, type QuotaData } from '@/lib/services/quota';

export type QuotaSnapshot = {
  limit: number | null;
  used: number;
  pending: number;
  periodStart: string | null;
};

/**
 * Hook for managing quota/usage information
 */
export function useQuotaManagement() {
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const [quotaSnapshot, setQuotaSnapshot] = useState<QuotaSnapshot | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const quotaLimit = quotaSnapshot?.limit ?? null;
  const quotaUsed = quotaSnapshot?.used ?? 0;
  const quotaPending = quotaSnapshot?.pending ?? 0;

  const remainingQuota = useMemo(() => {
    if (quotaLimit === null) {
      return Number.POSITIVE_INFINITY;
    }
    const remaining = quotaLimit - quotaUsed - quotaPending;
    return remaining > 0 ? remaining : 0;
  }, [quotaLimit, quotaPending, quotaUsed]);

  const isQuotaExhausted = quotaLimit !== null && remainingQuota <= 0;

  const quotaTitle = isQuotaExhausted
    ? t('offers.wizard.quota.exhaustedTitle')
    : t('offers.wizard.quota.availableTitle');

  const quotaDescription = useMemo(() => {
    if (quotaLoading) {
      return t('offers.wizard.quota.loading');
    }
    if (quotaError) {
      return quotaError;
    }
    if (isQuotaExhausted) {
      return t('offers.wizard.quota.exhaustedDescription');
    }
    return t('offers.wizard.quota.availableDescription');
  }, [isQuotaExhausted, quotaError, quotaLoading]);

  const quotaRemainingText = useMemo(() => {
    if (quotaLoading || quotaError) {
      return null;
    }
    if (quotaLimit === null) {
      return t('offers.wizard.quota.unlimited');
    }
    return t('offers.wizard.quota.remainingLabel', {
      remaining: remainingQuota,
      limit: quotaLimit,
    });
  }, [quotaError, quotaLimit, quotaLoading, remainingQuota]);

  const quotaPendingText = useMemo(() => {
    if (quotaLoading || quotaError || quotaLimit === null || quotaPending <= 0) {
      return null;
    }
    return t('offers.wizard.quota.pendingInfo', { count: quotaPending });
  }, [quotaError, quotaLimit, quotaLoading, quotaPending]);

  // Load quota function - use unified quota service
  const loadQuota = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    setQuotaLoading(true);
    try {
      const quotaData = await getQuotaData(sb, null, null);

      setPlan(quotaData.plan);
      setQuotaSnapshot({
        limit: quotaData.limit,
        used: quotaData.confirmed,
        pending: quotaData.pendingUser,
        periodStart: quotaData.periodStart,
      });
      setQuotaError(null);
    } catch (quotaLoadError) {
      console.error('Failed to load usage quota for new offer wizard.', quotaLoadError);
      // Try to get plan from profile as fallback
      try {
        const { data: prof } = await sb
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle();
        const { resolveEffectivePlan } = await import('@/lib/subscription');
        const normalizedPlan = resolveEffectivePlan(prof?.plan ?? null);
        setPlan(normalizedPlan);

        if (normalizedPlan === 'pro') {
          setQuotaSnapshot({ limit: null, used: 0, pending: 0, periodStart: null });
          setQuotaError(null);
        } else {
          setQuotaSnapshot(null);
          setQuotaError(t('offers.wizard.quota.loadFailed'));
        }
      } catch {
        setQuotaSnapshot(null);
        setQuotaError(t('offers.wizard.quota.loadFailed'));
      }
    } finally {
      setQuotaLoading(false);
    }
  }, [authStatus, sb, t, user]);

  // Load quota on mount and when refresh trigger changes
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    loadQuota();
  }, [authStatus, user, refreshTrigger, loadQuota]);

  // Set up real-time subscriptions for quota updates
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    // Subscribe to usage_counters changes for this user
    const usageChannel = sb
      .channel(`quota-usage-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh quota on any usage counter update (period check handled by get_quota_snapshot)
          loadQuota();
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
          loadQuota();
        },
      )
      .subscribe();

    // Subscribe to pdf_jobs changes for this user
    // This tracks when jobs are created (pending) or completed (affects pending count)
    const jobsChannel = sb
      .channel(`quota-jobs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pdf_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Debounce rapid changes
          setTimeout(() => {
            loadQuota();
          }, 500);
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(usageChannel);
      sb.removeChannel(jobsChannel);
    };
  }, [authStatus, sb, user, loadQuota]);

  const refreshQuota = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    plan,
    quotaSnapshot,
    quotaLoading,
    quotaError,
    quotaLimit,
    quotaUsed,
    quotaPending,
    remainingQuota,
    isQuotaExhausted,
    quotaTitle,
    quotaDescription,
    quotaRemainingText,
    quotaPendingText,
    refreshQuota,
  };
}
