/**
 * Cursor-based pagination hook for dashboard offers
 *
 * This is a drop-in replacement or alternative to the existing offset-based pagination.
 * Can be used alongside existing code or as a complete replacement.
 *
 * Usage:
 * ```tsx
 * const { offers, loadMore, hasMore, isLoading } = useOffersCursorPagination({
 *   userId: user.id,
 *   filter: 'all',
 *   teamIds: [],
 * });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchWithSupabaseAuth } from '@/lib/api';
import type { Offer } from '@/app/dashboard/types';
import type { CursorPaginationResult } from '@/lib/pagination/cursor';

interface UseOffersCursorPaginationOptions {
  userId: string;
  filter?: 'all' | 'my' | 'team' | 'member';
  teamIds?: string[];
  memberIds?: string[];
  enabled?: boolean;
  pageSize?: number;
}

interface UseOffersCursorPaginationResult {
  offers: Offer[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for cursor-based pagination of offers
 * Provides better performance for large datasets compared to offset pagination
 */
export function useOffersCursorPagination({
  userId,
  filter = 'all',
  teamIds = [],
  memberIds = [],
  enabled = true,
  pageSize = 12,
}: UseOffersCursorPaginationOptions): UseOffersCursorPaginationResult {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchOffers = useCallback(
    async (cursor: string | null = null, append = false) => {
      if (!enabled || !userId) {
        return;
      }

      const loadingState = append ? setIsLoadingMore : setIsLoading;
      loadingState(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          limit: String(pageSize),
          filter,
          ...(teamIds.length > 0 && { teamIds: teamIds.join(',') }),
          ...(memberIds.length > 0 && { memberIds: memberIds.join(',') }),
          ...(cursor && { cursor }),
        });

        const response = await fetchWithSupabaseAuth(`/api/offers/list?${searchParams.toString()}`);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Failed to fetch offers' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data: CursorPaginationResult<Offer> = await response.json();

        setOffers((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasNext);
        setNextCursor(data.nextCursor);

        if (!isInitialized) {
          setIsInitialized(true);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        loadingState(false);
      }
    },
    [enabled, userId, filter, teamIds, memberIds, pageSize, isInitialized],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) {
      return;
    }
    await fetchOffers(nextCursor, true);
  }, [hasMore, isLoadingMore, nextCursor, fetchOffers]);

  const reset = useCallback(() => {
    setOffers([]);
    setNextCursor(null);
    setHasMore(false);
    setError(null);
    setIsInitialized(false);
    fetchOffers(null, false);
  }, [fetchOffers]);

  const refresh = useCallback(async () => {
    setOffers([]);
    setNextCursor(null);
    setHasMore(false);
    await fetchOffers(null, false);
  }, [fetchOffers]);

  // Initial load
  useEffect(() => {
    if (enabled && userId && !isInitialized) {
      fetchOffers(null, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]);

  // Reset when filter changes
  useEffect(() => {
    if (isInitialized) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, teamIds.join(','), memberIds.join(',')]);

  return {
    offers,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
  };
}
