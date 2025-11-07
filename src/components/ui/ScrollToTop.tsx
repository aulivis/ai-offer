'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { t } from '@/copy';

interface ScrollToTopProps {
  /**
   * Minimum scroll distance in pixels before showing the button
   * @default 400
   */
  threshold?: number;
  /**
   * Smooth scroll behavior
   * @default true
   */
  smooth?: boolean;
}

export function ScrollToTop({ threshold = 400, smooth = true }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
      aria-label={t('ui.scrollToTop.label')}
      title={t('ui.scrollToTop.title')}
    >
      <ArrowUpIcon className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
