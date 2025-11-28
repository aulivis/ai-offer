/**
 * React Query hooks for offers data fetching
 *
 * Provides intelligent caching, background refetching, and optimistic updates
 * for offers-related queries.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { fetchWithSupabaseAuth } from '@/lib/api';
import type { Offer } from '@/app/dashboard/types';

const OFFERS_QUERY_KEY = 'offers' as const;

interface OffersQueryParams {
  filter?: 'all' | 'my' | 'team' | 'member';
  teamIds?: string[];
  memberIds?: string[];
  cursor?: string | null;
  limit?: number;
}

interface OffersQueryResponse {
  items: Offer[];
  hasNext: boolean;
  nextCursor: string | null;
  estimatedTotal?: number | null;
}

/**
 * Fetch offers using cursor-based pagination API
 */
async function fetchOffers(params: OffersQueryParams): Promise<OffersQueryResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit ?? 12),
    ...(params.filter && { filter: params.filter }),
    ...(params.teamIds && params.teamIds.length > 0 && { teamIds: params.teamIds.join(',') }),
    ...(params.memberIds &&
      params.memberIds.length > 0 && { memberIds: params.memberIds.join(',') }),
    ...(params.cursor && { cursor: params.cursor }),
  });

  const response = await fetchWithSupabaseAuth(`/api/offers/list?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch offers' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to fetch offers with cursor-based pagination
 *
 * @example
 * ```tsx
 * const { data, isLoading, fetchNextPage, hasNextPage } = useOffers({
 *   filter: 'all',
 *   teamIds: ['team-1'],
 * });
 * ```
 */
export function useOffers(
  params: OffersQueryParams,
  options?: Omit<UseQueryOptions<OffersQueryResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [OFFERS_QUERY_KEY, params],
    queryFn: () => fetchOffers(params),
    ...options,
  });
}

/**
 * Hook to fetch offers with infinite scroll support
 * Uses React Query's infinite query for seamless pagination
 */
export function useInfiniteOffers(params: Omit<OffersQueryParams, 'cursor' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: [OFFERS_QUERY_KEY, 'infinite', params],
    queryFn: ({ pageParam = null }) =>
      fetchOffers({
        ...params,
        cursor: pageParam,
        limit: 12,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
  });
}

/**
 * Hook to invalidate offers cache
 * Useful after mutations (create, update, delete)
 */
export function useInvalidateOffers() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: [OFFERS_QUERY_KEY] }),
    invalidateFilter: (filter?: string) =>
      queryClient.invalidateQueries({ queryKey: [OFFERS_QUERY_KEY, { filter }] }),
  };
}

/**
 * Hook for optimistic offer updates
 * Useful for updating offer status optimistically before server confirms
 */
export function useOptimisticOfferUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, updates }: { offerId: string; updates: Partial<Offer> }) => {
      // This is a placeholder - implement actual API call
      const response = await fetchWithSupabaseAuth(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update offer');
      }

      return response.json();
    },
    onMutate: async ({ offerId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [OFFERS_QUERY_KEY] });

      // Snapshot previous values
      const previousOffers = queryClient.getQueriesData({ queryKey: [OFFERS_QUERY_KEY] });

      // Optimistically update cache
      queryClient.setQueriesData<OffersQueryResponse>({ queryKey: [OFFERS_QUERY_KEY] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          items: old.items.map((offer) =>
            offer.id === offerId ? { ...offer, ...updates } : offer,
          ),
        };
      });

      return { previousOffers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOffers) {
        context.previousOffers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: [OFFERS_QUERY_KEY] });
    },
  });
}
