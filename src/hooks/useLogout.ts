'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { t } from '@/copy';
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
        throw new Error(t('errors.auth.logoutMissingCsrf'));
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
            : t('errors.auth.logoutFailed');
        throw new Error(message);
      }

      router.replace('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
      const message = err instanceof Error ? err.message : t('errors.auth.logoutUnknown');
      showToast({
        title: t('toasts.logout.failed.title'),
        description: message || t('toasts.logout.failed.description'),
        variant: 'error',
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [router, showToast]);

  return { logout, isLoggingOut } as const;
}
