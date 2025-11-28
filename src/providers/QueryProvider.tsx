'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useMemo, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider with optimized default configuration
 * 
 * Features:
 * - Automatic background refetching
 * - Optimistic updates support
 - Cache management
 * - DevTools in development
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient instance with stable reference
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is considered fresh for 30 seconds
            // After this, React Query will refetch in the background on mount
            staleTime: 1000 * 30, // 30 seconds
            // Cache time: unused data stays in cache for 5 minutes
            gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus (good for keeping data fresh)
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect by default (can be overridden per query)
            refetchOnReconnect: false,
            // Refetch on mount if data is stale
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
