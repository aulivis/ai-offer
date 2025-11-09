'use client';

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/styles/animations';

/**
 * React hook for reduced motion preference
 * 
 * Returns true if the user prefers reduced motion, false otherwise.
 * Updates automatically when the preference changes.
 * 
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const animationDuration = reducedMotion ? 0 : 300;
 * ```
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Set initial value
    setReducedMotion(prefersReducedMotion());

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Fallback for older browsers
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return reducedMotion;
}

