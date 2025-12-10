'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to enable View Transitions API for route changes
 */
export function useViewTransition() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === 'undefined' || !('startViewTransition' in document)) {
      return;
    }

    // View Transitions API is automatically handled by the browser
    // when navigating between pages with matching view-transition-name
    // CSS already configured in globals.css
  }, [pathname]);
}

/**
 * Component wrapper that enables View Transitions API
 * The actual transitions are handled by CSS in globals.css
 * Enhanced with consistent animation patterns
 */
export function ViewTransition({ children }: { children: React.ReactNode }) {
  useViewTransition();
  return <>{children}</>;
}
