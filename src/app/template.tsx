'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Template component for View Transitions API
 *
 * This component enables smooth page transitions using the View Transitions API.
 * It automatically applies view transition names to key elements and respects
 * user's reduced motion preferences.
 *
 * In Next.js App Router, template.tsx is called for each segment when navigating,
 * making it perfect for implementing view transitions.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    // Check if View Transitions API is supported
    if (typeof document !== 'undefined') {
      setIsSupported('startViewTransition' in document);
    }
  }, []);

  React.useEffect(() => {
    // Skip if not supported or reduced motion is preferred
    if (!isSupported || reducedMotion) {
      return;
    }

    // Apply view transition names to key elements
    const applyTransitionNames = () => {
      // Header
      const header = document.querySelector('header');
      if (header && !header.style.viewTransitionName) {
        header.style.viewTransitionName = 'header';
      }

      // Main content area
      const main = document.querySelector('main') || document.querySelector('[role="main"]');
      if (main && !main.style.viewTransitionName) {
        main.style.viewTransitionName = 'main-content';
      }

      // Footer
      const footer = document.querySelector('footer');
      if (footer && !footer.style.viewTransitionName) {
        footer.style.viewTransitionName = 'footer';
      }
    };

    // Use View Transitions API for navigation
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      applyTransitionNames();
    }
  }, [pathname, isSupported, reducedMotion]);

  return <>{children}</>;
}

