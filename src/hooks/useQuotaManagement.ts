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

  // Load quota function that can be called on mount and on refresh
  const loadQuota = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    // Load plan from profile
    const { data: prof } = await sb
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

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

      const limit = snapshot.quota_limit !== null && snapshot.quota_limit !== undefined ? Number(snapshot.quota_limit) : null;
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
      console.error('Failed to load usage quota for new offer wizard.', quotaLoadError);
      if (normalizedPlan === 'pro') {
        setQuotaSnapshot({ limit: null, used: 0, pending: 0, periodStart: null });
        setQuotaError(null);
      } else {
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

    const { iso: expectedPeriod } = currentMonthStart();

    // Subscribe to usage_counters changes for this user and period
    const usageChannel = sb
      .channel(`quota-usage-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as { period_start?: string; offers_generated?: number };
          // Only refresh if the period matches
          if (updated.period_start === expectedPeriod) {
            console.log('Usage counter updated via realtime, refreshing quota', {
              userId: user.id,
              period: updated.period_start,
              offersGenerated: updated.offers_generated,
            });
            loadQuota();
          }
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
        (payload) => {
          const inserted = payload.new as { period_start?: string };
          if (inserted.period_start === expectedPeriod) {
            console.log('Usage counter inserted via realtime, refreshing quota', {
              userId: user.id,
              period: inserted.period_start,
            });
            loadQuota();
          }
        },
      )
      .subscribe();

    // Subscribe to pdf_jobs changes for this user and period
    // This tracks when jobs are created (pending) or completed (affects pending count)
    const jobsChannel = sb
      .channel(`quota-jobs-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pdf_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const job = (payload.new || payload.old) as { id?: string; status?: string; created_at?: string } | null;
          if (!job?.created_at) return;

          // Check if job is in the current period
          const jobDate = new Date(job.created_at);
          const jobPeriod = new Date(jobDate.getFullYear(), jobDate.getMonth(), 1)
            .toISOString()
            .split('T')[0];

          if (jobPeriod === expectedPeriod) {
            console.log('PDF job changed via realtime, refreshing quota', {
              userId: user.id,
              event: payload.eventType,
              jobId: job.id,
              status: job.status,
              period: jobPeriod,
            });
            // Debounce rapid changes
            setTimeout(() => {
              loadQuota();
            }, 500);
          }
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







