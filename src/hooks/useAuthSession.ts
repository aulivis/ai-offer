'use client';

import type { User } from '@supabase/supabase-js';
import { useSession } from './queries/useSession';

type AuthSessionState = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
};

/**
 * Hook for checking authentication session
 * Uses React Query internally for caching and request deduplication
 *
 * @deprecated Consider using useSession() directly for better React Query integration
 * This hook is kept for backward compatibility
 */
export function useAuthSession(): AuthSessionState {
  const { user, isLoading, isAuthenticated } = useSession();

  return {
    status: isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated',
    user,
  };
}
