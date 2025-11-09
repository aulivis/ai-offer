import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { consumeRateLimit, getClientIdentifier, type RateLimitResult } from '@/lib/rateLimiting';

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
};

export async function checkRateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig,
): Promise<RateLimitResult | null> {
  try {
    const clientId = getClientIdentifier(req);
    const rateLimitKey = `${config.keyPrefix}:${clientId}`;
    const supabase = supabaseServiceRole();

    return await consumeRateLimit(supabase, rateLimitKey, config.maxRequests, config.windowMs);
  } catch (error) {
    console.error('Rate limit check failed', { error });
    // Return null to allow request to proceed if rate limiting fails
    return null;
  }
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };
}

/**
 * Adds rate limit headers to an existing NextResponse.
 * Use this to add rate limit information to successful responses.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult | null,
): NextResponse {
  if (result) {
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export function createRateLimitResponse(
  result: RateLimitResult,
  errorMessage: string,
): NextResponse {
  const retrySeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return NextResponse.json(
    { error: errorMessage },
    {
      status: 429,
      headers: {
        'Retry-After': retrySeconds.toString(),
        ...createRateLimitHeaders(result),
      },
    },
  );
}
