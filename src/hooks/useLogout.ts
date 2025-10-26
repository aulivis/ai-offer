'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ToastProvider';
import { getCsrfToken } from '@/lib/api';

export function useLogout() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        throw new Error('Hiányzó hitelesítési token. Töltsd újra az oldalt, majd próbáld újra.');
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error?: string }).error as string)
            : 'Nem sikerült kijelentkezni.';
        throw new Error(message);
      }

      router.replace('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
      const message =
        err instanceof Error ? err.message : 'Ismeretlen hiba történt kijelentkezés közben.';
      showToast({
        title: 'Kijelentkezés sikertelen',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [router, showToast]);

  return { logout, isLoggingOut } as const;
}
