/**
 * React Query-based dashboard offers hook
 *
 * Migrates dashboard offers fetching to use React Query for better caching,
 * background refetching, and optimistic updates.
 */

import { useInfiniteOffers, useInvalidateOffers, useOptimisticOfferUpdate } from './useOffers';
import { useOffersRealtime } from '@/hooks/realtime/useOffersRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Offer, OfferFilter } from '@/app/dashboard/types';

interface UseDashboardOffersReactQueryOptions {
  offerFilter: OfferFilter;
  teamMemberFilter: string[];
  teamIds: string[];
  userId: string | undefined;
}

/**
 * Hook to fetch dashboard offers using React Query
 *
 * Provides:
 * - Intelligent caching with automatic background refetching
 * - Real-time updates via Supabase subscriptions
 * - Optimistic updates for mutations
 * - Infinite scroll support
 *
 * @example
 * ```tsx
 * const { offers, isLoading, hasMore, loadMore } = useDashboardOffersReactQuery({
 *   offerFilter: 'all',
 *   teamMemberFilter: [],
 *   teamIds: ['team-1'],
 *   userId: user.id,
 * });
 * ```
 */
export function useDashboardOffersReactQuery({
  offerFilter,
  teamMemberFilter,
  teamIds,
  userId,
}: UseDashboardOffersReactQueryOptions) {
  const queryClient = useQueryClient();
  const invalidateOffers = useInvalidateOffers();
  const optimisticUpdate = useOptimisticOfferUpdate();

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      filter?: 'all' | 'my' | 'team' | 'member';
      teamIds?: string[];
      memberIds?: string[];
    } = {};

    if (offerFilter === 'my') {
      params.filter = 'my';
    } else if (offerFilter === 'team') {
      params.filter = 'team';
      params.teamIds = teamIds;
    } else if (offerFilter === 'all') {
      params.filter = 'all';
      if (teamIds.length > 0) {
        params.teamIds = teamIds;
      }
    } else if (offerFilter === 'member' && teamMemberFilter.length > 0) {
      params.filter = 'member';
      params.memberIds = teamMemberFilter;
    } else {
      params.filter = 'my';
    }

    return params;
  }, [offerFilter, teamIds, teamMemberFilter]);

  // Use infinite query for pagination
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useInfiniteOffers(queryParams);

  // Flatten pages into single array
  const offers = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // Set up real-time subscriptions
  useOffersRealtime({
    userId,
    teamIds,
    enabled: !!userId,
    onOfferInserted: (_newOffer) => {
      // Invalidate cache to refetch with new offer
      invalidateOffers.invalidateAll();
    },
    onOfferUpdated: (updatedOffer) => {
      // Optimistically update cache
      queryClient.setQueriesData<{ items: Offer[] }>({ queryKey: ['offers'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((offer) => (offer.id === updatedOffer.id ? updatedOffer : offer)),
        };
      });
    },
    onOfferDeleted: (deletedId) => {
      // Remove from cache
      queryClient.setQueriesData<{ items: Offer[] }>({ queryKey: ['offers'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((offer) => offer.id !== deletedId),
        };
      });
    },
  });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    offers,
    loading: isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    loadMore,
    error,
    optimisticUpdate,
    invalidateOffers,
  };
}
