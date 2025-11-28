'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { t } from '@/copy';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { useSupabase } from '@/components/SupabaseProvider';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type OptionalAuthState = {
  status: AuthStatus;
  user: User | null;
  error: Error | null;
};

// Cache for unauthenticated state to prevent excessive session checks
// Cache expires after 5 seconds to allow for rapid login/logout scenarios
let unauthenticatedCache: { timestamp: number } | null = null;
const CACHE_DURATION_MS = 5000; // 5 seconds

function isUnauthenticatedCached(): boolean {
  if (!unauthenticatedCache) {
    return false;
  }
  const now = Date.now();
  if (now - unauthenticatedCache.timestamp > CACHE_DURATION_MS) {
    unauthenticatedCache = null;
    return false;
  }
  return true;
}

function setUnauthenticatedCache(): void {
  unauthenticatedCache = { timestamp: Date.now() };
}

function clearUnauthenticatedCache(): void {
  unauthenticatedCache = null;
}

// Export for use in logout to clear cache immediately
export { clearUnauthenticatedCache };

export function useOptionalAuth(): OptionalAuthState {
  const supabase = useSupabase();
  const [state, setState] = useState<OptionalAuthState>({
    status: 'loading',
    user: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const syncSession = async () => {
      // Skip session check if we recently confirmed user is unauthenticated
      // This prevents excessive API calls when multiple components check auth simultaneously
      if (isUnauthenticatedCached()) {
        if (active) {
          setState({ status: 'unauthenticated', user: null, error: null });
        }
        return;
      }

      try {
        const response = await fetchWithSupabaseAuth('/api/auth/session', {
          signal: abortController.signal,
          defaultErrorMessage: t('errors.auth.sessionCheckFailed'),
        });

        if (!active) {
          return;
        }

        type SessionPayload = { user?: User | null } | null;
        const payload = (await response.json().catch(() => null)) as SessionPayload;
        const user = payload?.user ?? null;

        if (!user) {
          setUnauthenticatedCache();
          setState({ status: 'unauthenticated', user: null, error: null });
          return;
        }

        // User is authenticated, clear cache
        clearUnauthenticatedCache();
        setState({ status: 'authenticated', user, error: null });
      } catch (err) {
        if (!active) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticatedCache();
          setState({ status: 'unauthenticated', user: null, error: null });
          return;
        }

        const fallback =
          err instanceof Error ? err : new Error(t('errors.auth.verificationUnknown'));
        setState({ status: 'unauthenticated', user: null, error: fallback });
      }
    };

    syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (session?.user) {
        // User authenticated, clear cache
        clearUnauthenticatedCache();
        setState({ status: 'authenticated', user: session.user, error: null });
      } else {
        // User unauthenticated, set cache
        setUnauthenticatedCache();
        setState({ status: 'unauthenticated', user: null, error: null });
      }
    });

    return () => {
      active = false;
      abortController.abort();
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
}
