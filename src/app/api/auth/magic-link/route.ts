import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { envServer } from '@/env.server';
import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { supabaseServiceRole } from '../../../lib/supabaseServiceRole';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { createAuthRequestLogger } from '@/lib/observability/authLogging';
import {
  consumeMagicLinkRateLimit,
  hashMagicLinkEmailKey,
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
} from './rateLimiter';

/**
 * A magic link elküldésekor eltároljuk a végső redirect útvonalat
 * egy HTTPOnly sütiben (post_auth_redirect), majd a Supabase-nek csak
 * a publikus /auth/callback-et adjuk meg emailRedirectTo-ként (query nélkül).
 */
export async function POST(request: Request) {
  const logger = createAuthRequestLogger();
  const body = await request.json().catch(() => ({}));
  const email = (body?.email ?? '').toString().trim().toLowerCase();
  const requestedRedirect = (body?.redirect_to ?? '').toString();
  const rememberMe = Boolean(body?.remember_me);

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Check rate limit before processing
  try {
    const rateLimitKey = hashMagicLinkEmailKey(email);
    const supabase = supabaseServiceRole();
    const rateLimitResult = await consumeMagicLinkRateLimit(supabase, rateLimitKey);

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000);
      logger.warn('Magic link rate limit exceeded', {
        email,
        retryAfterMs: rateLimitResult.retryAfterMs,
        maxAttempts: RATE_LIMIT_MAX_ATTEMPTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
      });
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before requesting another magic link.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_ATTEMPTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.retryAfterMs).toISOString(),
          },
        },
      );
    }
  } catch (rateLimitError) {
    logger.error('Rate limit check failed', rateLimitError);
    // Continue with the request if rate limiting fails (fail open)
    // This prevents rate limiting issues from blocking legitimate requests
  }

  // A végső cél szanitizálása és eltárolása sütiben
  const finalRedirect = sanitizeOAuthRedirect(requestedRedirect, '/dashboard');
  const jar = await cookies();
  const isSecure = envServer.APP_URL.startsWith('https');

  jar.set({
    name: 'post_auth_redirect',
    value: finalRedirect,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 5 * 60,
  });

  // Store remember_me preference in a cookie for the callback handler
  if (rememberMe) {
    jar.set({
      name: 'remember_me',
      value: 'true',
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 5 * 60, // 5 minutes, just enough for the auth flow
    });
  }

  // A magic link a publikus /auth/callback-re mutat (nem tartalmaz query-t)
  const publicCallback = new URL('/auth/callback', envServer.APP_URL);
  const supabase = supabaseAnonServer();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: publicCallback.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    logger.error('Magic link dispatch failed.', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
