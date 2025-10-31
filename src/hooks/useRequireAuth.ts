'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { t } from '@/copy';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type RequireAuthState = {
  status: AuthStatus;
  user: User | null;
  error: Error | null;
};

type RequireAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useRequireAuth(
  redirectOverride?: string,
  options?: RequireAuthOptions,
): RequireAuthState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchString = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const redirectTarget = useMemo(() => {
    if (redirectOverride) {
      return redirectOverride;
    }
    if (!pathname) {
      return null;
    }
    return searchString ? `${pathname}?${searchString}` : pathname;
  }, [pathname, redirectOverride, searchString]);

  const redirectOnUnauthenticated = options?.redirectOnUnauthenticated ?? true;

  const [state, setState] = useState<RequireAuthState>({
    status: 'loading',
    user: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const verify = async () => {
      try {
        const response = await fetchWithSupabaseAuth('/api/auth/session', {
          signal: abortController.signal,
          authErrorMessage: t('errors.auth.sessionInvalid'),
          defaultErrorMessage: t('errors.auth.sessionCheckFailed'),
        });
        if (!active) {
          return;
        }

        type SessionPayload = { user?: User | null } | null;
        const payload = (await response.json().catch(() => null)) as SessionPayload;
        const user = payload?.user ?? null;

        if (!user) {
          throw new ApiError(t('errors.auth.sessionInvalid'), { status: 401 });
        }

        setState({ status: 'authenticated', user, error: null });
      } catch (error) {
        if (!active || isAbortError(error)) {
          return;
        }
        const err =
          error instanceof Error ? error : new Error(t('errors.auth.verificationUnknown'));
        setState({ status: 'unauthenticated', user: null, error: err });
        if (redirectOnUnauthenticated) {
          const redirectQuery = redirectTarget
            ? `?redirect=${encodeURIComponent(redirectTarget)}`
            : '';
          router.replace(`/login${redirectQuery}`);
        }
      }
    };

    verify();

    return () => {
      active = false;
      abortController.abort();
    };
  }, [redirectOnUnauthenticated, redirectTarget, router]);

  return state;
}
