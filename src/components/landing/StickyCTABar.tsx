'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthSession } from '@/hooks/useAuthSession';
import { trackCTAClick } from '@/lib/analytics';
import { t } from '@/copy';

export default function StickyCTABar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { status: authStatus } = useAuthSession();
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    // Check if dismissed in sessionStorage
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('stickyBarDismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }
    }

    // Only show for non-authenticated users
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling down 300px
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, isDismissed]);

  const handleClose = () => {
    setIsDismissed(true);
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('stickyBarDismissed', 'true');
    }
  };

  if (!isVisible || isAuthenticated || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
      <div className="w-full border-t-2 border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/15 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-fg">{t('landing.stickyBar.title')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => trackCTAClick('free_trial', 'sticky_bar')}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                {t('landing.stickyBar.ctaPrimary')}
              </Link>
              <Link
                href="/billing"
                onClick={() => trackCTAClick('pricing', 'sticky_bar')}
                className="hidden sm:inline-flex items-center justify-center rounded-lg border border-primary/30 bg-white/50 px-4 py-1.5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-white/70"
              >
                {t('landing.stickyBar.ctaSecondary')}
              </Link>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 text-fg-muted transition-colors hover:bg-black/10 hover:text-fg"
            aria-label={t('landing.stickyBar.closeAria')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
