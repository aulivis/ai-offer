/**
 * React hook for cursor-based pagination
 *
 * Provides a simple interface for fetching paginated data using cursor-based pagination
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithSupabaseAuth } from '@/lib/api';
import type { CursorPaginationResult } from '@/lib/pagination/cursor';

interface UseCursorPaginationOptions {
  endpoint: string;
  params?: Record<string, string>;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseCursorPaginationResult<T> {
  items: T[];
  isLoading: boolean;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
  error: Error | null;
}

export function useCursorPagination<T>({
  endpoint,
  params = {},
  enabled = true,
  onError,
}: UseCursorPaginationOptions): UseCursorPaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cursorRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchPage = useCallback(
    async (cursor: string | null = null, reset = false) => {
      if (isLoadingRef.current || !enabled) {
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          ...params,
          ...(cursor && { cursor }),
        });

        const url = `${endpoint}?${searchParams.toString()}`;
        const response = await fetchWithSupabaseAuth(url, {});

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data: CursorPaginationResult<T> = await response.json();

        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasNext(data.hasNext);
        cursorRef.current = data.nextCursor;

        // Reset loading state
        isLoadingRef.current = false;
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        isLoadingRef.current = false;
        setIsLoading(false);
        onError?.(error);
      }
    },
    [endpoint, params, enabled, onError],
  );

  const loadMore = useCallback(() => {
    return fetchPage(cursorRef.current, false);
  }, [fetchPage]);

  const reset = useCallback(() => {
    setItems([]);
    cursorRef.current = null;
    setHasNext(false);
    setError(null);
    fetchPage(null, true);
  }, [fetchPage]);

  // Initial load
  useEffect(() => {
    if (enabled && items.length === 0 && !isLoadingRef.current) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    items,
    isLoading,
    hasNext,
    loadMore,
    reset,
    error,
  };
}
