'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { t } from '@/copy';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';

type AuthSessionState = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
};

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    status: 'loading',
    user: null,
  });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetchWithSupabaseAuth('/api/auth/session', {
          defaultErrorMessage: t('errors.auth.sessionCheckFailed'),
        });
        const payload: unknown = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }

        const user =
          payload &&
          typeof payload === 'object' &&
          'user' in payload &&
          typeof (payload as { user?: unknown }).user === 'object'
            ? ((payload as { user: User | null }).user ?? null)
            : null;

        if (user) {
          setState({ status: 'authenticated', user });
        } else {
          setState({ status: 'unauthenticated', user: null });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          setState({ status: 'unauthenticated', user: null });
          return;
        }

        console.error('Failed to load authentication session.', error);
        setState((prev) =>
          prev.status === 'authenticated' ? prev : { status: 'unauthenticated', user: null },
        );
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}
