import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withTimeout, API_TIMEOUTS } from '@/lib/timeout';

const UNAUTHENTICATED_MESSAGE = 'A bejelentkezés lejárt vagy érvénytelen.';

// Request deduplication cache - stores access token hash -> promise mapping
// Prevents duplicate database queries for the same session check
// Uses LRU-style eviction to prevent memory leaks
const requestCache = new Map<
  string,
  { promise: Promise<NextResponse>; timestamp: number; userId?: string }
>();
const REQUEST_CACHE_TTL_MS = 5000; // 5 seconds - matches React Query staleTime
const REQUEST_CACHE_MAX_SIZE = 1000; // Maximum cache entries
const REQUEST_CACHE_CLEANUP_INTERVAL_MS = 30000; // Cleanup every 30 seconds

// Store cleanup interval ID for potential cleanup on server shutdown
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Cleanup function to remove expired entries and enforce size limit
function cleanupRequestCache(): void {
  const now = Date.now();

  // Remove expired entries
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > REQUEST_CACHE_TTL_MS) {
      requestCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries (LRU eviction)
  if (requestCache.size > REQUEST_CACHE_MAX_SIZE) {
    const entries = Array.from(requestCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, requestCache.size - REQUEST_CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      requestCache.delete(key);
    }
  }
}

// Cleanup old cache entries periodically and enforce size limit
if (typeof setInterval !== 'undefined') {
  cleanupIntervalId = setInterval(cleanupRequestCache, REQUEST_CACHE_CLEANUP_INTERVAL_MS);

  // Cleanup on process termination
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    const cleanup = () => {
      if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
      }
      requestCache.clear();
    };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
}

// Create a simple hash of the access token for cache key
// Only use first and last 8 chars + length to avoid storing full token
function createCacheKey(accessToken: string): string {
  if (accessToken.length < 16) {
    return accessToken;
  }
  return `${accessToken.slice(0, 8)}_${accessToken.length}_${accessToken.slice(-8)}`;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    await clearAuthCookies();
    const response = NextResponse.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  // Check for existing request with same token (deduplication)
  const cacheKey = createCacheKey(accessToken);
  const cached = requestCache.get(cacheKey);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    // If request is still fresh (< 5 seconds), return cached promise
    if (age < REQUEST_CACHE_TTL_MS) {
      log.info('Returning deduplicated session check', { cacheKey, age });
      return cached.promise;
    }
    // Remove stale cache entry
    requestCache.delete(cacheKey);
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
            const response = NextResponse.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
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
        const response = NextResponse.json(
          { error: 'A bejelentkezés ellenőrzése túl sokáig tartott. Kérjük, próbáld újra.' },
          { status: 504 },
        );
        return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
      }

      log.error('Failed to load Supabase user', error);
      const response = NextResponse.json(
        { error: 'Nem sikerült ellenőrizni a bejelentkezést.' },
        { status: 500 },
      );
      return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
    } finally {
      // Remove from cache after request completes (success or failure)
      // The cache is primarily for deduplication, not long-term storage
      requestCache.delete(cacheKey);
    }
  })();

  // Store promise in cache for deduplication
  requestCache.set(cacheKey, {
    promise: requestPromise,
    timestamp: Date.now(),
  });

  return requestPromise;
}
