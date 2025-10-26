'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { useSupabase } from '@/components/SupabaseProvider';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type OptionalAuthState = {
  status: AuthStatus;
  user: User | null;
  error: Error | null;
};

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
      try {
        const response = await fetchWithSupabaseAuth('/api/auth/session', {
          signal: abortController.signal,
          defaultErrorMessage: 'Nem sikerült ellenőrizni a bejelentkezést.',
        });

        if (!active) {
          return;
        }

        type SessionPayload = { user?: User | null } | null;
        const payload = (await response.json().catch(() => null)) as SessionPayload;
        const user = payload?.user ?? null;

        if (!user) {
          setState({ status: 'unauthenticated', user: null, error: null });
          return;
        }

        setState({ status: 'authenticated', user, error: null });
      } catch (err) {
        if (!active) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          setState({ status: 'unauthenticated', user: null, error: null });
          return;
        }

        const fallback =
          err instanceof Error ? err : new Error('Ismeretlen hiba azonosítás közben.');
        setState({ status: 'unauthenticated', user: null, error: fallback });
      }
    };

    syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, error: null });
      } else {
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
