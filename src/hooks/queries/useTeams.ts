/**
 * React Query hooks for teams data fetching
 *
 * Provides intelligent caching, background refetching, and request deduplication
 * for teams-related queries.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithSupabaseAuth } from '@/lib/api';

const TEAMS_QUERY_KEY = ['teams'] as const;

export type TeamMember = {
  user_id: string;
  email: string | null;
  joined_at: string;
};

export type Team = {
  team_id: string;
  members: TeamMember[];
};

interface TeamsResponse {
  teams: Team[];
}

/**
 * Hook to fetch teams
 *
 * Features:
 * - Automatic caching (30s stale time, 5min cache time)
 * - Request deduplication (multiple components can use this without extra requests)
 * - Automatic retry on failure
 * - Background refetching
 *
 * @param enabled - Whether to enable the query (default: true). Set to false to skip fetching.
 *
 * @example
 * ```tsx
 * const { teams, isLoading, error } = useTeams();
 * ```
 *
 * @example
 * ```tsx
 * // Conditionally enable query
 * const { teams, isLoading } = useTeams({ enabled: isPro });
 * ```
 */
export function useTeams(options?: { enabled?: boolean }) {
  const query = useQuery<TeamsResponse, Error>({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetchWithSupabaseAuth('/api/teams', {
        defaultErrorMessage: 'Nem sikerült betölteni a csapatokat.',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch teams' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: options?.enabled !== false, // Default to true, but allow disabling
    staleTime: 1000 * 30, // 30 seconds - teams are considered fresh for 30s
    gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache for 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: true,
    refetchOnMount: false, // Don't refetch on every mount if data is fresh
    refetchOnReconnect: true,
  });

  return {
    teams: query.data?.teams ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a new team
 *
 * Automatically invalidates and refetches teams after successful creation
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, void>({
    mutationFn: async () => {
      const response = await fetchWithSupabaseAuth('/api/teams', {
        method: 'POST',
        defaultErrorMessage: 'Nem sikerült létrehozni a csapatot.',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create team' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate teams query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete/leave a team
 *
 * Automatically invalidates and refetches teams after successful deletion
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (teamId: string) => {
      const response = await fetchWithSupabaseAuth(`/api/teams/${teamId}`, {
        method: 'DELETE',
        defaultErrorMessage: 'Nem sikerült elhagyni a csapatot.',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete team' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
    },
    onSuccess: () => {
      // Invalidate teams query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
}

/**
 * Get teams query key for cache invalidation
 * Use with queryClient.invalidateQueries({ queryKey: useTeamsQueryKey() })
 */
export function useTeamsQueryKey() {
  return TEAMS_QUERY_KEY;
}

