'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/hooks/useToast';
import { t } from '@/copy';
import { createClientLogger } from '@/lib/clientLogger';
import type { Offer, OfferFilter } from '@/app/dashboard/types';
import { PAGE_SIZE, mergeOfferPages } from '@/app/dashboard/offersPagination';
import { DASHBOARD_CONFIG } from '@/constants/dashboard';

type UseDashboardOffersOptions = {
  offerFilter: OfferFilter;
  teamMemberFilter: string[];
  teamIds: string[];
};

export function useDashboardOffers({
  offerFilter,
  teamMemberFilter,
  teamIds,
}: UseDashboardOffersOptions) {
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () =>
      createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useDashboardOffers' }),
    [user?.id],
  );

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (
      user: string,
      pageNumber: number,
      filter: OfferFilter = 'all',
      memberIds: string[] = [],
      teamIdsParam: string[] = [],
    ): Promise<{ items: Offer[]; count: number | null }> => {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Ensure session is initialized from cookies before querying
      try {
        const { ensureSession } = await import('@/lib/supabaseClient');
        await ensureSession(user, {
          maxRetries: 8,
          initialDelay: 150,
          maxDelay: 3000,
        });
      } catch (error) {
        logger.error('Failed to ensure Supabase session', error, { userId: user });
        const errorMessage =
          error instanceof Error ? error.message : 'Session initialization failed';

        showToast({
          title: t('errors.auth.sessionFailed'),
          description: errorMessage,
          variant: 'error',
        });

        throw new Error(errorMessage);
      }

      await new Promise((resolve) => setTimeout(resolve, DASHBOARD_CONFIG.SESSION_CHECK_DELAY_MS));
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();
      const sessionMatches = session?.user?.id === user;

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Dashboard auth session check', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionError: sessionError?.message,
          matchesUserId: sessionMatches,
        });
      }

      if (!sessionMatches) {
        logger.error('Session verification failed after ensureSession', undefined, {
          expectedUserId: user,
          sessionUserId: session?.user?.id,
        });

        showToast({
          title: t('errors.auth.sessionVerificationFailed'),
          description: t('errors.auth.sessionVerificationFailedDescription'),
          variant: 'error',
        });

        throw new Error('Session verification failed. Please refresh the page.');
      }

      // Build query based on filter
      let query = sb
        .from('offers')
        .select(
          'id,title,status,created_at,decided_at,decision,pdf_url,recipient_id,user_id,created_by,updated_by,team_id,recipient:recipient_id ( company_name )',
          { count: 'exact' },
        );

      try {
        if (filter === 'my') {
          query = query.eq('user_id', user);
        } else if (filter === 'team') {
          if (teamIdsParam.length === 0) {
            return { items: [], count: 0 };
          }
          query = query.not('team_id', 'is', null).in('team_id', teamIdsParam);
        } else if (filter === 'all') {
          if (teamIdsParam.length > 0) {
            query = query.or(`user_id.eq.${user},team_id.in.(${teamIdsParam.join(',')})`);
          } else {
            query = query.eq('user_id', user);
          }
        } else if (filter === 'member' && memberIds.length > 0) {
          query = query.in('created_by', memberIds);
        } else {
          query = query.eq('user_id', user);
        }
      } catch (queryBuildError) {
        logger.error('Failed to build query', queryBuildError, {
          userId: user,
          filter,
          teamIdsParam,
          memberIds,
        });
        throw new Error(
          `Failed to build query: ${queryBuildError instanceof Error ? queryBuildError.message : String(queryBuildError)}`,
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        const errorInfo: Record<string, unknown> = {
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          errorMessage: error.message,
          userId: user,
          filter,
          pageNumber,
          teamIdsParam,
          memberIds,
        };

        logger.error('Dashboard fetch error', error, errorInfo);

        const errorMessage =
          error.message ||
          error.details ||
          error.hint ||
          `Database error: ${error.code || 'unknown'}`;

        const enhancedError = new Error(errorMessage);
        (enhancedError as { originalError?: unknown }).originalError = error;
        throw enhancedError;
      }

      if (data === null || data === undefined) {
        const nullDataError = new Error('Query returned null data');
        logger.error('Dashboard query returned null data', nullDataError, {
          userId: user,
          filter,
          pageNumber,
          teamIdsParam,
          memberIds,
        });
        throw nullDataError;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Dashboard fetched offers', {
          userId: user,
          pageNumber,
          count,
          itemsCount: Array.isArray(data) ? data.length : 0,
        });
      }

      const rawItems = Array.isArray(data) ? data : [];
      const offerIds = rawItems.map((entry) => String(entry.id));

      // Fetch share analytics for all offers
      let shareAnalytics: Record<
        string,
        {
          view_count: number;
          share_expiry_status: 'active' | 'expired' | 'none';
          earliest_expires_at: string | null;
        }
      > = {};

      if (offerIds.length > 0) {
        try {
          const { data: sharesData, error: sharesError } = await sb
            .from('offer_shares')
            .select('offer_id, access_count, expires_at, is_active')
            .in('offer_id', offerIds);

          if (!sharesError && sharesData) {
            const now = new Date();
            shareAnalytics = offerIds.reduce(
              (acc, offerId) => {
                const offerShares = sharesData.filter((s) => String(s.offer_id) === offerId);
                if (offerShares.length === 0) {
                  acc[offerId] = {
                    view_count: 0,
                    share_expiry_status: 'none',
                    earliest_expires_at: null,
                  };
                } else {
                  const activeShares = offerShares.filter((s) => s.is_active);
                  const view_count = activeShares.reduce(
                    (sum, s) => sum + (s.access_count || 0),
                    0,
                  );
                  const expiresDates = activeShares
                    .map((s) => (s.expires_at ? new Date(s.expires_at) : null))
                    .filter((d): d is Date => d !== null);
                  const earliest_expires_at =
                    expiresDates.length > 0
                      ? new Date(Math.min(...expiresDates.map((d) => d.getTime()))).toISOString()
                      : null;

                  let share_expiry_status: 'active' | 'expired' | 'none' = 'none';
                  if (activeShares.length > 0) {
                    const hasExpired = activeShares.some(
                      (s) => s.expires_at && new Date(s.expires_at) < now,
                    );
                    const hasActive = activeShares.some(
                      (s) => !s.expires_at || new Date(s.expires_at) >= now,
                    );
                    if (hasExpired && !hasActive) {
                      share_expiry_status = 'expired';
                    } else if (hasActive) {
                      share_expiry_status = 'active';
                    }
                  }

                  acc[offerId] = {
                    view_count,
                    share_expiry_status,
                    earliest_expires_at,
                  };
                }
                return acc;
              },
              {} as typeof shareAnalytics,
            );
          }
        } catch (sharesError) {
          // Silently fail - analytics are optional
          const errorData =
            sharesError instanceof Error
              ? {
                  error: {
                    name: sharesError.name,
                    message: sharesError.message,
                    stack: process.env.NODE_ENV === 'production' ? undefined : sharesError.stack,
                  },
                }
              : sharesError !== undefined
                ? { error: String(sharesError) }
                : undefined;
          logger.warn('Failed to fetch share analytics', errorData);
        }
      }

      const items = rawItems.map((entry): Offer => {
        const recipientValue = Array.isArray(entry.recipient)
          ? (entry.recipient[0] ?? null)
          : (entry.recipient ?? null);

        const offerId = String(entry.id);
        const analytics = shareAnalytics[offerId] || {
          view_count: 0,
          share_expiry_status: 'none' as const,
          earliest_expires_at: null,
        };

        // Calculate acceptance time (days between created_at and decided_at if accepted)
        let acceptance_time_days: number | null = null;
        if (entry.status === 'accepted' && entry.created_at && entry.decided_at) {
          const createdDate = new Date(entry.created_at);
          const decidedDate = new Date(entry.decided_at);
          if (!isNaN(createdDate.getTime()) && !isNaN(decidedDate.getTime())) {
            const diffMs = decidedDate.getTime() - createdDate.getTime();
            acceptance_time_days = Math.round(diffMs / (1000 * 60 * 60 * 24));
          }
        }

        return {
          id: offerId,
          title: typeof entry.title === 'string' ? entry.title : '',
          status: (entry.status ?? 'draft') as Offer['status'],
          created_at: entry.created_at ?? null,
          decided_at: entry.decided_at ?? null,
          decision: (entry.decision ?? null) as Offer['decision'],
          pdf_url: entry.pdf_url ?? null,
          recipient_id: entry.recipient_id ?? null,
          recipient: recipientValue,
          ...(typeof entry.user_id === 'string' ? { user_id: entry.user_id } : {}),
          ...(typeof entry.created_by === 'string' ? { created_by: entry.created_by } : {}),
          updated_by: typeof entry.updated_by === 'string' ? entry.updated_by : null,
          team_id: typeof entry.team_id === 'string' ? entry.team_id : null,
          created_by_user: null,
          updated_by_user: null,
          view_count: analytics.view_count,
          acceptance_time_days,
          share_expiry_status: analytics.share_expiry_status,
          earliest_expires_at: analytics.earliest_expires_at,
        };
      });

      return {
        items,
        count: typeof count === 'number' ? count : null,
      };
    },
    [sb, showToast, logger],
  );

  // Use refs to store latest callbacks to avoid unnecessary re-subscriptions
  const fetchPageRef = useRef(fetchPage);
  const showToastRef = useRef(showToast);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
    showToastRef.current = showToast;
  }, [fetchPage, showToast]);

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    if (authStatus !== 'authenticated' || !user) {
      return () => {
        active = false;
        abortController.abort();
      };
    }

    const loadInitialPage = async () => {
      if (abortController.signal.aborted) return;
      setLoading(true);
      try {
        const memberIds = offerFilter === 'member' ? teamMemberFilter : [];
        const { items, count } = await fetchPageRef.current(
          user.id,
          0,
          offerFilter,
          memberIds,
          teamIds,
        );
        if (!active || abortController.signal.aborted) return;
        setOffers(items);
        setPageIndex(0);
        setTotalCount(count);
      } catch (error) {
        let errorMessage = t('toasts.offers.loadFailed.description');
        let errorDetails: Record<string, unknown> = {};

        if (error && typeof error === 'object') {
          if ('code' in error || 'message' in error || 'details' in error || 'hint' in error) {
            const supabaseError = error as {
              code?: string;
              message?: string;
              details?: string;
              hint?: string;
            };
            errorMessage = supabaseError.message || errorMessage;
            errorDetails = {
              code: supabaseError.code,
              details: supabaseError.details,
              hint: supabaseError.hint,
            };
          } else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
            errorDetails = {
              name: error.name,
              stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            };
          } else {
            errorMessage = String(error);
          }
        }

        const logContext = {
          userId: user?.id,
          offerFilter,
          teamIds,
          teamMemberFilter,
          ...errorDetails,
        };

        logger.error('Failed to load offers', error, logContext);

        showToastRef.current({
          title: t('toasts.offers.loadFailed.title'),
          description: errorMessage,
          variant: 'error',
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialPage();

    let wasHidden = false;
    let hiddenTimestamp = 0;

    const handleVisibilityChange = () => {
      if (!active || abortController.signal.aborted) return;

      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible' && wasHidden) {
        const hiddenDuration = Date.now() - hiddenTimestamp;
        if (hiddenDuration > DASHBOARD_CONFIG.VISIBILITY_REFRESH_THRESHOLD_MS) {
          loadInitialPage();
        }
        wasHidden = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      abortController.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authStatus, user, offerFilter, teamMemberFilter, teamIds, fetchPageRef, logger]);

  const hasMore = totalCount !== null ? offers.length < totalCount : false;

  const handleLoadMore = useCallback(async () => {
    if (!user || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = pageIndex + 1;
      const memberIds = offerFilter === 'member' ? teamMemberFilter : [];
      const { items, count } = await fetchPage(user.id, nextPage, offerFilter, memberIds, teamIds);
      setOffers((prev) => mergeOfferPages(prev, items));
      if (count !== null) setTotalCount(count);
      setPageIndex(nextPage);
    } catch (error) {
      logger.error('Failed to load more offers', error);
      const message =
        error instanceof Error ? error.message : t('toasts.offers.loadMoreFailed.description');
      showToast({
        title: t('toasts.offers.loadMoreFailed.title'),
        description: message || t('toasts.offers.loadMoreFailed.description'),
        variant: 'error',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    fetchPage,
    hasMore,
    isLoadingMore,
    pageIndex,
    showToast,
    user,
    offerFilter,
    teamMemberFilter,
    teamIds,
    logger,
  ]);

  return {
    offers,
    loading,
    totalCount,
    isLoadingMore,
    hasMore,
    pageIndex,
    setOffers,
    setTotalCount,
    handleLoadMore,
  };
}
