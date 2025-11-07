'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthSession } from '@/hooks/useAuthSession';
import { trackCTAClick } from '@/lib/analytics';

export default function StickyCTABar() {
  const [isVisible, setIsVisible] = useState(false);
  const { status: authStatus } = useAuthSession();
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    // Only show for non-authenticated users
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated]);

  if (!isVisible || isAuthenticated) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-7xl border-t border-border bg-bg/95 px-6 py-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-bg/90">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-base font-semibold text-fg">
              Készen állsz, hogy profibb ajánlatokat készíts?
            </p>
            <p className="text-sm text-fg-muted">
              Kezdj el ingyen még ma - nincs bankkártya szükséges
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => trackCTAClick('free_trial', 'sticky_bar')}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-ink shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Ingyenes próba
            </Link>
            <Link
              href="/billing"
              onClick={() => trackCTAClick('pricing', 'sticky_bar')}
              className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-base font-semibold text-fg transition-all duration-200 hover:border-primary hover:text-primary"
            >
              Csomagok
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

