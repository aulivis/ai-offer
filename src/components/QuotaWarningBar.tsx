'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { t } from '@/copy';
import { getDeviceIdFromCookie } from '@/lib/deviceId';
import { 
  getQuotaData, 
  isUserQuotaExhausted as checkUserQuotaExhausted, 
  isDeviceQuotaExhausted as checkDeviceQuotaExhausted, 
  type QuotaData 
} from '@/lib/services/quota';

export default function QuotaWarningBar() {
  const sb = useSupabase();
  const { status: authStatus, user } = useOptionalAuth();
  const [quotaSnapshot, setQuotaSnapshot] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load quota function - use unified quota service
  const loadQuota = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const deviceId = getDeviceIdFromCookie();
      const quotaData = await getQuotaData(sb, deviceId, null);
      setQuotaSnapshot(quotaData);
    } catch (error) {
      // Silently handle auth errors - user is not authenticated, which is expected
      if (error instanceof Error && (error.message?.includes('authenticated') || error.message?.includes('PGRST301'))) {
        setQuotaSnapshot(null);
        return;
      }
      console.error('Failed to load quota for warning bar:', error);
      setQuotaSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [authStatus, sb, user]);

  // Load quota on mount
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsLoading(false);
      return;
    }

    loadQuota();
  }, [authStatus, user, sb, loadQuota]);

  // Set up real-time subscriptions for quota updates
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    // Subscribe to usage_counters changes
    const usageChannel = sb
      .channel(`quota-warning-usage-${user.id}`)
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

    // Subscribe to pdf_jobs changes
    const jobsChannel = sb
      .channel(`quota-warning-jobs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

  const quotaStatus = useMemo((): {
    isQuotaExhausted: boolean;
    isDeviceQuotaExhausted: boolean;
    warningType: 'both' | 'user' | 'device' | null;
  } => {
    if (!quotaSnapshot || isLoading) {
      return { isQuotaExhausted: false, isDeviceQuotaExhausted: false, warningType: null };
    }

    // Use unified quota service helpers (imported functions)
    const userQuotaExhausted: boolean = checkUserQuotaExhausted(quotaSnapshot);
    const deviceQuotaExhausted: boolean = checkDeviceQuotaExhausted(quotaSnapshot);

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

  const { isQuotaExhausted, isDeviceQuotaExhausted, warningType } = quotaStatus;

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
