'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook to debounce a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
  options?: { leading?: boolean; trailing?: boolean },
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leadingCalledRef = useRef(false);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const { leading = false, trailing = true } = options || {};

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Call immediately on leading edge if enabled and not already called
      if (leading && !leadingCalledRef.current) {
        callback(...args);
        leadingCalledRef.current = true;
      }

      // Set timeout for trailing edge
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (!leading || leadingCalledRef.current) {
            callback(...args);
          }
          leadingCalledRef.current = false;
        }, delay);
      }
    }) as T,
    [callback, delay, options],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

