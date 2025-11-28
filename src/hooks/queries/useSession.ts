/**
 * Shared session query hook using React Query
 * This reduces redundant session checks across multiple components
 */

import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { t } from '@/copy';

type SessionResponse = {
  user: User | null;
};

const SESSION_QUERY_KEY = ['auth', 'session'] as const;

/**
 * Shared hook for checking authentication session
 * Uses React Query to cache and deduplicate session checks
 *
 * Features:
 * - Automatic caching (30s stale time)
 * - Request deduplication (multiple components can use this without extra requests)
 * - Automatic retry on failure
 * - Background refetching
 */
export function useSession() {
  const query = useQuery<SessionResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const response = await fetchWithSupabaseAuth('/api/auth/session', {
        defaultErrorMessage: t('errors.auth.sessionCheckFailed'),
      });

      if (!response.ok) {
        // Handle 401 as unauthenticated, not an error
        if (response.status === 401) {
          return { user: null };
        }

        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(errorText || 'Failed to check session');
      }

      const payload = (await response.json().catch(() => null)) as SessionResponse | null;
      return payload || { user: null };
    },
    staleTime: 1000 * 30, // 30 seconds - session is considered fresh for 30s
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized) - user is simply not authenticated
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on every mount if data is fresh
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  return {
    user: query.data?.user ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isAuthenticated: !!query.data?.user,
    refetch: query.refetch,
  };
}

/**
 * Get session query key for cache invalidation
 * Use with queryClient.invalidateQueries({ queryKey: useInvalidateSession() })
 */
export function useInvalidateSession() {
  return SESSION_QUERY_KEY;
}
