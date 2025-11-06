import { type NextRequest, NextResponse } from 'next/server';

/**
 * Adds appropriate cache headers to API responses.
 * Use this for GET endpoints that return cacheable data.
 */
export function addCacheHeaders(
  response: NextResponse,
  options: {
    maxAge?: number; // Cache duration in seconds
    staleWhileRevalidate?: number; // Stale-while-revalidate duration in seconds
    mustRevalidate?: boolean; // Whether to require revalidation
  } = {},
): NextResponse {
  const { maxAge = 0, staleWhileRevalidate, mustRevalidate = false } = options;

  const cacheDirectives: string[] = [];

  if (maxAge > 0) {
    cacheDirectives.push(`max-age=${maxAge}`);
    if (staleWhileRevalidate) {
      cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }
    if (mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }
  } else {
    cacheDirectives.push('no-store', 'no-cache', 'must-revalidate');
  }

  response.headers.set('Cache-Control', cacheDirectives.join(', '));
  return response;
}

/**
 * Common cache configurations for different data types
 */
export const CACHE_CONFIGS = {
  // Public data that changes infrequently
  PUBLIC_STABLE: { maxAge: 3600, staleWhileRevalidate: 86400 }, // 1 hour, stale for 24h
  // User-specific data that changes occasionally
  USER_DATA: { maxAge: 300, staleWhileRevalidate: 3600 }, // 5 minutes, stale for 1h
  // Dynamic data that should not be cached
  NO_CACHE: { maxAge: 0, mustRevalidate: true },
  // Static assets
  STATIC: { maxAge: 31536000 }, // 1 year
} as const;




