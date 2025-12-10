'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { useToast } from '@/components/ToastProvider';
import { t } from '@/copy';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { createClientLogger } from '@/lib/clientLogger';

const CHECKOUT_API_PATH = '/api/stripe/checkout';

type SubscriptionUsage = {
  offersGenerated: number;
  periodStart: string | null;
};

export function useSubscriptionManagement() {
  const supabase = useSupabase();
  const router = useRouter();
  const { status: authStatus, user } = useOptionalAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () =>
      createClientLogger({
        ...(user?.id && { userId: user.id }),
        component: 'useSubscriptionManagement',
      }),
    [user?.id],
  );

  const [plan, setPlan] = useState<'free' | 'standard' | 'pro' | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const isAuthenticated = authStatus === 'authenticated' && !!user;

  useEffect(() => {
    setEmail(user?.email ?? null);
  }, [user]);

  // Load subscription data
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPlan(null);
      setUsage(null);
      setLoading(null);
      setIsLoadingData(false);
      return;
    }

    let active = true;
    setIsLoadingData(true);

    (async () => {
      try {
        // Use unified quota service - single source of truth
        const { getQuotaData } = await import('@/lib/services/quota');
        const quotaData = await getQuotaData(supabase, null, null);

        if (!active) {
          return;
        }

        setPlan(quotaData.plan);
        setUsage({
          offersGenerated: quotaData.confirmed,
          periodStart: quotaData.periodStart,
        });
        setIsLoadingData(false);
      } catch (error) {
        if (!active) {
          return;
        }
        logger.error('Failed to load billing information', error);
        setIsLoadingData(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, supabase, user]);

  const startCheckout = useCallback(
    async (priceId: string) => {
      try {
        setLoading(priceId);
        const resp = await fetchWithSupabaseAuth(CHECKOUT_API_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, email }),
          authErrorMessage: t('billing.checkout.authRequired'),
          defaultErrorMessage: t('billing.checkout.error'),
        });
        const { url } = (await resp.json()) as { url?: string | null };
        if (url) router.push(url);
        else setLoading(null);
      } catch (e) {
        logger.error('Failed to start checkout', e, { priceId, email });
        const message =
          e instanceof ApiError && typeof e.message === 'string' && e.message.trim()
            ? e.message
            : t('billing.checkout.unexpected');
        showToast({
          title: t('billing.checkout.error'),
          description: message,
          variant: 'error',
        });
        setLoading(null);
      }
    },
    [email, router, showToast, logger],
  );

  const planLimit = useMemo<number | null>(() => {
    if (plan === 'pro') return null;
    if (plan === 'standard') return 5;
    return 2;
  }, [plan]);

  return {
    plan,
    usage,
    isLoadingData,
    loading,
    email,
    planLimit,
    startCheckout,
    isAuthenticated,
  };
}

