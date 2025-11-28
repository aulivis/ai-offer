'use client';

import { useCallback, useState } from 'react';

import { t } from '@/copy';
import { useToast } from '@/components/ToastProvider';
import { getCsrfToken } from '@/lib/api';
import { clientLogger } from '@/lib/clientLogger';
import { getSupabaseClient, resetSessionState } from '@/lib/supabaseClient';
import { clearUnauthenticatedCache } from '@/hooks/useOptionalAuth';

export function useLogout() {
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

      // Clear all client-side state before navigation
      // 1. Clear Supabase client session
      const supabaseClient = getSupabaseClient();
      try {
        await supabaseClient.auth.signOut();
      } catch (signOutError) {
        // Log but don't fail - cookies are already cleared server-side
        clientLogger.warn('Failed to clear Supabase client session during logout', {
          error: signOutError,
        });
      }

      // 2. Reset session state
      resetSessionState();

      // 3. Clear unauthenticated cache
      clearUnauthenticatedCache();

      // 4. Use hard navigation to ensure all state is cleared
      // This is the industry best practice for logout to ensure complete state reset
      window.location.href = '/login';
    } catch (err) {
      clientLogger.error('Logout failed', err);
      const message = err instanceof Error ? err.message : t('errors.auth.logoutUnknown');
      showToast({
        title: t('toasts.logout.failed.title'),
        description: message || t('toasts.logout.failed.description'),
        variant: 'error',
      });
      setIsLoggingOut(false);
    }
    // Note: setIsLoggingOut(false) is not called in the success path
    // because window.location.href causes a full page reload
  }, [showToast]);

  return { logout, isLoggingOut } as const;
}
