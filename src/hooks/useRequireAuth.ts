'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { useSupabase } from '@/components/SupabaseProvider';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type RequireAuthState = {
  status: AuthStatus;
  user: User | null;
  error: Error | null;
};

export function useRequireAuth(redirectOverride?: string): RequireAuthState {
  const supabase = useSupabase();
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

  const [state, setState] = useState<RequireAuthState>({
    status: 'loading',
    user: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) {
          return;
        }
        if (error) {
          throw error;
        }
        const user = data.user ?? null;
        if (!user) {
          setState({ status: 'unauthenticated', user: null, error: null });
          const redirectQuery = redirectTarget
            ? `?redirect=${encodeURIComponent(redirectTarget)}`
            : '';
          router.replace(`/login${redirectQuery}`);
          return;
        }
        setState({ status: 'authenticated', user, error: null });
      } catch (error) {
        if (!active) {
          return;
        }
        const err = error instanceof Error
          ? error
          : new Error('Ismeretlen hiba történt a hitelesítés során.');
        setState({ status: 'unauthenticated', user: null, error: err });
        router.replace('/login');
      }
    };

    verify();

    return () => {
      active = false;
    };
  }, [redirectTarget, router, supabase]);

  return state;
}
