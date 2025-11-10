'use client';

import * as React from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook to use View Transitions API programmatically
 *
 * Provides a wrapper around the View Transitions API that automatically
 * respects user's reduced motion preference.
 *
 * @returns Function to start a view transition
 *
 * @example
 * ```tsx
 * const startTransition = useViewTransition();
 *
 * const handleNavigation = () => {
 *   startTransition(() => {
 *     router.push('/dashboard');
 *   });
 * };
 * ```
 */
export function useViewTransition() {
  const reducedMotion = useReducedMotion();
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsSupported('startViewTransition' in document);
    }
  }, []);

  return React.useCallback(
    (callback: () => void) => {
      // Skip if reduced motion is preferred or API not supported
      if (reducedMotion || !isSupported) {
        callback();
        return;
      }

      // Use View Transitions API
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        interface DocumentWithViewTransition extends Document {
          startViewTransition: (callback: () => void) => ViewTransition;
        }
        (document as DocumentWithViewTransition).startViewTransition(() => {
          callback();
        });
      } else {
        callback();
      }
    },
    [reducedMotion, isSupported],
  );
}
