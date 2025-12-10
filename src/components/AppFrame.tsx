'use client';

import { t } from '@/copy';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState, useMemo } from 'react';

import { useToast } from '@/hooks/useToast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { createClientLogger } from '@/lib/clientLogger';
import { H1 } from '@/components/ui/Heading';

export type AppFrameProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  requireAuth?: boolean;
  redirectOnUnauthenticated?: boolean;
};

export default function AppFrame({
  title,
  description,
  actions,
  children,
  sidebar,
  requireAuth = true,
  redirectOnUnauthenticated,
}: AppFrameProps) {
  const pathname = usePathname();
  const { showToast } = useToast();
  // Only check auth if requireAuth is true, to avoid unnecessary API calls
  const shouldCheckAuth = requireAuth || redirectOnUnauthenticated === true;
  const { error, status, user } = useRequireAuth(undefined, {
    redirectOnUnauthenticated: redirectOnUnauthenticated ?? requireAuth,
    skip: !shouldCheckAuth,
  });
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'AppFrame' }),
    [user?.id],
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Only show error toast if we're actually checking auth
    if (!error || !shouldCheckAuth) {
      return;
    }
    logger.error('Failed to verify authentication status', error);
    showToast({
      title: t('toasts.auth.verificationFailed.title'),
      description: error.message || t('toasts.auth.verificationFailed.description'),
      variant: 'error',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, showToast, shouldCheckAuth]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (requireAuth && status !== 'authenticated') {
    return (
      <main
        id="main"
        className="flex min-h-[60vh] items-center justify-center px-6 pb-20 pt-24 text-sm font-medium text-fg-muted"
      >
        {t('app.loading')}
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-20 pt-24 md:flex-row md:gap-10">
      {sidebar ? (
        <>
          {/* Desktop sidebar - always visible with enhanced visual hierarchy */}
          <aside className="hidden md:sticky md:top-36 md:block md:w-64 md:flex-shrink-0">
            <div className="space-y-4 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-bg/95 to-primary/5 p-6 shadow-lg backdrop-blur-lg">
              {sidebar}
            </div>
          </aside>

          {/* Mobile sidebar toggle button - Enhanced visual hierarchy */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-turquoise-50/50 px-4 py-3 text-sm font-bold text-fg shadow-lg backdrop-blur transition-all duration-200 hover:border-primary/50 hover:from-primary/15 hover:to-turquoise-100/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden"
            aria-expanded={isSidebarOpen}
            aria-controls="appframe-sidebar"
            aria-label={t('app.sidebar.open')}
          >
            <span className="flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-primary"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-primary font-bold">{t('app.sidebar.open')}</span>
            </span>
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-primary transition-transform"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Mobile sidebar bottom sheet */}
          <BottomSheet
            open={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            enableSwipeToClose={true}
            swipeThreshold={0.25}
            showCloseButton={true}
            title={t('app.sidebar.title') || 'Navigation'}
            className="md:hidden"
          >
            <div id="appframe-sidebar" className="space-y-4">
              {sidebar}
            </div>
          </BottomSheet>
        </>
      ) : null}

      <main id="main" className="flex-1 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <H1 className="tracking-[-0.125rem]">{title}</H1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-col items-center gap-2 md:flex-row md:justify-end">
              <div className="flex items-center gap-2">{actions}</div>
            </div>
          ) : null}
        </header>

        {children}
      </main>
    </div>
  );
}
