/**
 * Shared notifications query hook using React Query
 * This reduces redundant notification checks across multiple components
 */

import { useQuery } from '@tanstack/react-query';
import { fetchWithSupabaseAuth } from '@/lib/api';

export interface Notification {
  id: string;
  offerId: string;
  type: 'response' | 'view' | 'share_created';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
};

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

interface UseNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Shared hook for fetching notifications
 * Uses React Query to cache and deduplicate notification requests
 *
 * Features:
 * - Automatic caching (30s stale time)
 * - Request deduplication (multiple components can use this without extra requests)
 * - Automatic retry on failure
 * - Background refetching
 * - Polling support (optional)
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { unreadOnly = false, limit = 50, offset = 0, enabled = true } = options;

  const query = useQuery<NotificationsResponse, Error>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, { unreadOnly, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(unreadOnly && { unreadOnly: 'true' }),
        limit: String(limit),
        offset: String(offset),
      });

      const response = await fetchWithSupabaseAuth(`/api/notifications?${params.toString()}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(errorText || 'Failed to fetch notifications');
      }

      return (await response.json()) as NotificationsResponse;
    },
    staleTime: 1000 * 30, // 30 seconds - notifications are considered fresh for 30s
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache for 5 minutes
    retry: 2, // Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on every mount if data is fresh
    refetchOnReconnect: true, // Refetch when network reconnects
    enabled, // Allow disabling the query
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get notifications query key for cache invalidation
 * Use with queryClient.invalidateQueries({ queryKey: useInvalidateNotifications() })
 */
export function useInvalidateNotifications() {
  return NOTIFICATIONS_QUERY_KEY;
}
