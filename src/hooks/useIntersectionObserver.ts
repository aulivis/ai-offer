'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Hook for Intersection Observer API
 *
 * Useful for progressive loading, infinite scroll, and lazy loading
 *
 * @param options - IntersectionObserver options
 * @returns Tuple of [ref, isIntersecting]
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit,
): [RefObject<T | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Start loading 100px before element is visible
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Hook for auto-loading more items when scroll reaches bottom
 *
 * @param onLoadMore - Callback to load more items
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether currently loading
 * @param options - IntersectionObserver options
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean,
  options?: IntersectionObserverInit,
) {
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>(options);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return ref;
}
