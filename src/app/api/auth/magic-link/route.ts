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

  // Magic link redirect URL: Use /api/auth/confirm for new token_hash flow
  // This enables shorter URLs and better reliability
  // The email template will construct the full URL with token_hash if available,
  // but we still set emailRedirectTo as a fallback for implicit flow compatibility
  const confirmUrl = new URL('/api/auth/confirm', envServer.APP_URL);
  // Also keep callback URL for legacy compatibility during migration
  const callbackUrl = new URL('/auth/callback', envServer.APP_URL);

  const supabase = supabaseAnonServer();

  logger.info('Requesting magic link', {
    email,
    confirmUrl: confirmUrl.toString(),
    callbackUrl: callbackUrl.toString(),
    rememberMe,
    finalRedirect,
    note: 'Email template will use token_hash flow if available, otherwise falls back to implicit flow',
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Use confirm route for new token_hash flow
      // Supabase will determine flow type based on Site URL configuration
      // If token_hash flow is enabled, the email template will use it
      // If not, it will fall back to implicit flow with ConfirmationURL
      emailRedirectTo: confirmUrl.toString(),
      shouldCreateUser: true,
      // Note: Supabase determines the flow type (implicit vs token_hash) based on:
      // 1. Site URL configuration in Supabase dashboard (must match APP_URL exactly)
      // 2. Redirect URL matching (we use /api/auth/confirm for token_hash flow)
      // 3. Email template configuration (template uses TokenHash if available)
      // Token_hash flow produces shorter URLs (~200 chars) and is less prone to truncation
      // Implicit flow produces longer URLs (~1200+ chars) with tokens in URL
    },
  });

  if (error) {
    logger.error('Magic link dispatch failed.', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }

  logger.info('Magic link sent successfully', {
    email,
    confirmUrl: confirmUrl.toString(),
    callbackUrl: callbackUrl.toString(),
    // Note: The actual magic link URL is generated by Supabase and sent via email
    // The email template will use:
    // - Token hash flow (preferred): /api/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard (short URLs, ~200 chars)
    // - Implicit flow (fallback): {{ .ConfirmationURL }} (long URLs, ~1200+ chars with tokens)
    // Supabase determines which flow based on Site URL configuration in dashboard
    // Check the email to see which flow is being used
  });

  return NextResponse.json({ ok: true });
}
