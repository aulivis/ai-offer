'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { resolveEffectivePlan } from '@/lib/subscription';
import { currentMonthStart } from '@/lib/services/usage';
import { t } from '@/copy';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';

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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    (async () => {
      // Load plan from profile
      const { data: prof } = await sb
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      const normalizedPlan = resolveEffectivePlan(prof?.plan ?? null);
      setPlan(normalizedPlan);

      // Load quota directly from database using RPC function
      setQuotaLoading(true);
      try {
        const { iso: expectedPeriod } = currentMonthStart();

        // Call database function directly - simpler and faster than API route
        const { data, error } = await sb.rpc('get_quota_snapshot', {
          p_period_start: expectedPeriod,
        });

        if (!active) {
          return;
        }

        if (error) {
          throw new Error(`Failed to load quota: ${error.message}`);
        }

        const snapshot = Array.isArray(data) ? data[0] : data;
        if (!snapshot) {
          throw new Error('No quota snapshot returned from database');
        }

        // Validate and normalize the response
        const planValue = snapshot.plan;
        if (planValue !== 'free' && planValue !== 'standard' && planValue !== 'pro') {
          throw new Error('Invalid plan in quota snapshot');
        }

        const limit = snapshot.limit !== null && snapshot.limit !== undefined ? Number(snapshot.limit) : null;
        const confirmed = Number.isFinite(snapshot.confirmed) ? Number(snapshot.confirmed) : 0;
        const pendingUser = Number.isFinite(snapshot.pending_user) ? Number(snapshot.pending_user) : 0;
        const periodStart = typeof snapshot.period_start === 'string' ? snapshot.period_start : expectedPeriod;

        setQuotaSnapshot({
          limit,
          used: confirmed,
          pending: pendingUser,
          periodStart,
        });
        setQuotaError(null);
      } catch (quotaLoadError) {
        if (!active) {
          return;
        }
        console.error('Failed to load usage quota for new offer wizard.', quotaLoadError);
        if (normalizedPlan === 'pro') {
          setQuotaSnapshot({ limit: null, used: 0, pending: 0, periodStart: null });
          setQuotaError(null);
        } else {
          setQuotaSnapshot(null);
          setQuotaError(t('offers.wizard.quota.loadFailed'));
        }
      } finally {
        if (active) {
          setQuotaLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authStatus, sb, t, user, refreshTrigger]);

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







