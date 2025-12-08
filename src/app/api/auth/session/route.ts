import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';
import { withErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withTimeout, API_TIMEOUTS } from '@/lib/timeout';

const UNAUTHENTICATED_MESSAGE = 'A bejelentkezés lejárt vagy érvénytelen.';

// Request deduplication cache - stores access token hash -> promise mapping
// Prevents duplicate database queries for the same session check
// Uses LRU cache with automatic TTL and size management to prevent memory leaks
const REQUEST_CACHE_TTL_MS = 5000; // 5 seconds - matches React Query staleTime
const REQUEST_CACHE_MAX_SIZE = 1000; // Maximum cache entries

const requestCache = new LRUCache<string, Promise<NextResponse>>({
  max: REQUEST_CACHE_MAX_SIZE,
  ttl: REQUEST_CACHE_TTL_MS,
  // LRU cache automatically handles TTL expiration and size limits
  // No need for manual cleanup intervals or process exit handlers
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// Create a simple hash of the access token for cache key
// Only use first and last 8 chars + length to avoid storing full token
function createCacheKey(accessToken: string): string {
  if (accessToken.length < 16) {
    return accessToken;
  }
  return `${accessToken.slice(0, 8)}_${accessToken.length}_${accessToken.slice(-8)}`;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    await clearAuthCookies();
    const response = createErrorResponse(UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  // Check for existing request with same token (deduplication)
  const cacheKey = createCacheKey(accessToken);
  const cached = requestCache.get(cacheKey);

  if (cached) {
    log.info('Returning deduplicated session check', { cacheKey });
    return cached;
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      return await withTimeout(
        async (_signal) => {
          const supabase = await supabaseServer();

          const { data, error } = await supabase.auth.getUser(accessToken);
          if (error || !data?.user) {
            log.warn('Session validation failed', { error: error?.message });
            await clearAuthCookies();
            const response = createErrorResponse(UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
            // Don't cache 401 responses
            return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
          }

          log.setContext({ userId: data.user.id });
          const response = NextResponse.json({ user: data.user });
          // Cache authenticated responses for 5 seconds with stale-while-revalidate
          // This allows faster responses while still keeping data fresh
          return addCacheHeaders(response, {
            maxAge: 5, // 5 seconds
            staleWhileRevalidate: 10, // Allow stale for 10 seconds while revalidating
            mustRevalidate: false,
          });
        },
        API_TIMEOUTS.DATABASE,
        'Session validation timed out',
      );
    } catch (error) {
      // Handle timeout and other errors
      if (error instanceof Error && error.message.includes('timed out')) {
        log.error('Session validation timed out', error);
        const response = createErrorResponse(
          'A bejelentkezés ellenőrzése túl sokáig tartott. Kérjük, próbáld újra.',
          HttpStatus.GATEWAY_TIMEOUT,
        );
        return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
      }

      log.error('Failed to load Supabase user', error);
      throw error;
    } finally {
      // Remove from cache after request completes (success or failure)
      // The cache is primarily for deduplication, not long-term storage
      requestCache.delete(cacheKey);
    }
  })();

  // Store promise in cache for deduplication
  // LRU cache automatically handles TTL expiration, no manual cleanup needed
  requestCache.set(cacheKey, requestPromise);

  return requestPromise;
});
