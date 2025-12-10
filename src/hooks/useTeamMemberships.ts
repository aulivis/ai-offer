'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getUserTeams } from '@/lib/services/teams';
import { createClientLogger } from '@/lib/clientLogger';

/**
 * Hook to fetch and manage team memberships for the current user
 *
 * Returns the list of team IDs that the user belongs to.
 * Automatically refetches when authentication status changes.
 */
export function useTeamMemberships() {
  const sb = useSupabase();
  const { user, status: authStatus } = useRequireAuth();
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const logger = useMemo(
    () =>
      createClientLogger({
        ...(user?.id && { userId: user.id }),
        component: 'useTeamMemberships',
      }),
    [user?.id],
  );

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setTeamIds([]);
      return;
    }

    const loadTeams = async () => {
      try {
        const ids = await getUserTeams(sb, user.id);
        setTeamIds(ids);
      } catch (error) {
        logger.error('Failed to load teams', error);
        setTeamIds([]);
      }
    };

    loadTeams();
  }, [authStatus, user, sb, logger]);

  return { teamIds };
}
