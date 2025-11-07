'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to scroll to first error when validation fails
 */
export function useScrollToError(errors: Record<string, string | undefined>) {
  const errorRefs = useRef<Record<string, HTMLElement>>({});

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => errors[key]);
    if (errorKeys.length === 0) {
      return;
    }

    const firstErrorKey = errorKeys[0];
    const errorElement = errorRefs.current[firstErrorKey];

    if (errorElement) {
      // Scroll to error with smooth behavior and offset for fixed header
      errorElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      // Focus the element for accessibility
      const input = errorElement.querySelector('input, textarea');
      if (input instanceof HTMLElement) {
        input.focus();
      }
    }
  }, [errors]);

  const registerErrorRef = (key: string, element: HTMLElement | null) => {
    if (element) {
      errorRefs.current[key] = element;
    } else {
      delete errorRefs.current[key];
    }
  };

  return { registerErrorRef };
}







