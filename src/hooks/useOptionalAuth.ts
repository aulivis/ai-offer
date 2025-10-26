'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

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

    const syncSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (error) {
          setState({ status: 'unauthenticated', user: null, error });
          return;
        }

        const user = data.session?.user ?? null;
        if (!user) {
          setState({ status: 'unauthenticated', user: null, error: null });
          return;
        }

        setState({ status: 'authenticated', user, error: null });
      } catch (err) {
        if (!active) {
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
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
}
