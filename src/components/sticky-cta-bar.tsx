'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { trackCTAClick } from '@/lib/analytics';
import { t } from '@/copy';

export function StickyCTABar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { status: authStatus } = useAuthSession();
  const isAuthenticated = authStatus === 'authenticated';

  useEffect(() => {
    // Don't show for authenticated users
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    // Check if user has previously dismissed the bar
    if (typeof window !== 'undefined') {
      try {
        const dismissed = localStorage.getItem('ctaBarDismissed');
        if (dismissed === 'true') {
          setIsDismissed(true);
          return;
        }
      } catch (_error) {
        // localStorage might not be available (private browsing, etc.)
        // Silently handle localStorage errors
      }
    }

    // Show bar after user scrolls past hero section
    // Using viewport height as threshold instead of magic number
    const HERO_SECTION_THRESHOLD = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800;

    const handleScroll = () => {
      if (window.scrollY > HERO_SECTION_THRESHOLD && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= HERO_SECTION_THRESHOLD) {
        setIsVisible(false);
      }
    };

    // Exit intent detection (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from top of viewport
      if (e.clientY <= 0 && !isVisible && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible, isDismissed, isAuthenticated]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ctaBarDismissed', 'true');
      } catch (_error) {
        // localStorage might not be available (private browsing, etc.)
        // Silently handle localStorage errors
      }
    }
  };

  if (isDismissed || !isVisible || isAuthenticated) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-turquoise-400 to-turquoise-500 shadow-2xl transform transition-transform duration-500 ease-out motion-safe:animate-in motion-safe:slide-in-from-bottom"
      role="region"
      aria-label={t('landing.stickyBar.ariaLabel') || 'Call to action'}
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Message */}
          <div className="text-center sm:text-left flex-1">
            <p className="text-white font-semibold text-base sm:text-lg leading-snug text-balance">
              {t('landing.stickyBar.title')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/login?redirect=/new"
              onClick={() => trackCTAClick('free_trial', 'sticky_bar')}
              className="w-full sm:w-auto bg-bg-muted hover:bg-bg text-primary font-bold px-6 py-2.5 rounded-lg shadow-lg transition-all transform hover:scale-105 whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              {t('landing.stickyBar.ctaPrimary')}
            </Link>
            <Link
              href="/billing"
              onClick={() => trackCTAClick('pricing', 'sticky_bar')}
              className="w-full sm:w-auto border-2 border-white hover:bg-white/10 text-white font-semibold px-6 py-2.5 rounded-lg transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center"
            >
              {t('landing.stickyBar.ctaSecondary')}
            </Link>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors min-h-[44px] min-w-[44px]"
            aria-label={t('landing.stickyBar.closeAria')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
