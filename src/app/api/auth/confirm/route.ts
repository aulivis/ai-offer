import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { CSRF_COOKIE_NAME, createCsrfToken } from '@/lib/auth/csrf';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { createAuthRequestLogger, type RequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkCallback, recordAuthRouteUsage } from '@/lib/observability/metrics';
import { Argon2Algorithm, argon2Hash, type Argon2Options } from '@/lib/auth/argon2';

const AUTH_CONFIRM_ERROR_REDIRECT = '/login?message=Unable%20to%20authenticate';
const DEFAULT_FALLBACK_PATH = '/dashboard';
const REMEMBER_ME_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days
const FALLBACK_EXPIRES_IN = 3600;

const ARGON2_OPTIONS: Argon2Options = {
  algorithm: Argon2Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Email OTP types allowed for token_hash flow
const EMAIL_OTP_TYPES = ['email', 'recovery'] as const;
type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

function normalizeOtpType(type: string | null): EmailOtpType | null {
  if (!type) return null;
  const normalized = type.trim().toLowerCase() as EmailOtpType | string;
  return EMAIL_OTP_TYPES.includes(normalized as EmailOtpType) ? (normalized as EmailOtpType) : null;
}

function parseExpiresIn(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return FALLBACK_EXPIRES_IN;
}

/**
 * Extract client IP address from request headers.
 * Checks x-forwarded-for (first IP) and x-real-ip headers.
 */
function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) {
      return first.trim();
    }
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

/**
 * Decode JWT payload without verification (for access token only).
 * Used to extract user ID from access token.
 */
function decodeJwtPayload<T = Record<string, unknown>>(jwt: string): T | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Persist session to database with hashed refresh token.
 * This enables session revocation, auditing, and quota enforcement.
 * Uses UPSERT to handle deduplication (same refresh token hash from different routes).
 */
async function persistSessionOpaque(
  userId: string,
  refreshToken: string,
  expiresInSec: number,
  request: Request,
  logger: RequestLogger,
  rememberMe: boolean = false,
) {
  const issuedAt = new Date();
  // If remember me is enabled, use longer expiration; otherwise use the token's expiration
  const sessionExpiresIn = rememberMe
    ? REMEMBER_ME_EXPIRES_IN_SECONDS
    : Math.max(1, expiresInSec || FALLBACK_EXPIRES_IN);
  const expiresAt = new Date(issuedAt.getTime() + sessionExpiresIn * 1000);

  const hashedRefresh = await argon2Hash(refreshToken, ARGON2_OPTIONS);
  const supabase = supabaseServiceRole();

  // Use UPSERT function to handle deduplication (same refresh token hash from different routes)
  // This prevents duplicate session records during migration from callback to confirm route
  const { data, error } = await supabase.rpc('upsert_session', {
    p_user_id: userId,
    p_rt_hash: hashedRefresh,
    p_issued_at: issuedAt.toISOString(),
    p_expires_at: expiresAt.toISOString(),
    p_ip: getClientIp(request),
    p_ua: request.headers.get('user-agent'),
  });

  if (error) {
    logger.error('Failed to persist session record during auth confirm', error);
    throw new Error('Unable to persist session record.');
  }

  logger.info('Session persisted or updated', {
    sessionId: data,
    userId,
  });
}

/**
 * Creates a redirect response with authentication cookies set.
 * Uses Next.js's built-in cookie API to properly set cookies on redirect responses.
 * This matches the pattern used in the callback route.
 *
 * For reliability, redirects to /auth/init-session first, which provides
 * client-side session initialization and cookie validation before final redirect.
 */
function redirectToWithCookies(
  path: string,
  request: NextRequest,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  csrfToken: string,
  userId: string,
  rememberMe: boolean = false,
): NextResponse {
  // Construct absolute URL from relative path
  const isAbsolute = path.startsWith('http://') || path.startsWith('https://');
  let absoluteUrl: string;

  if (isAbsolute) {
    absoluteUrl = path;
  } else {
    try {
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      absoluteUrl = `${baseUrl}${normalizedPath}`;
    } catch {
      absoluteUrl = `${envServer.APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
    }
  }

  // Redirect to /auth/init-session first for reliable cookie validation
  // This matches the pattern used in the callback route
  const initSessionPath = `/auth/init-session?redirect=${encodeURIComponent(absoluteUrl)}&user_id=${encodeURIComponent(userId)}`;
  let initSessionUrl: string;
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    initSessionUrl = `${baseUrl}${initSessionPath}`;
  } catch {
    initSessionUrl = `${envServer.APP_URL}${initSessionPath}`;
  }

  // Create redirect response
  const response = NextResponse.redirect(initSessionUrl, { status: 302 });

  // Set cookies on the redirect response using Next.js API
  // Calculate maxAge values
  const accessTokenMaxAge = expiresIn;
  const refreshTokenMaxAge = rememberMe
    ? REMEMBER_ME_EXPIRES_IN_SECONDS
    : Math.max(expiresIn, 7 * 24 * 60 * 60); // At least 7 days
  const csrfMaxAge = rememberMe
    ? REMEMBER_ME_EXPIRES_IN_SECONDS
    : Math.max(accessTokenMaxAge, 7 * 24 * 60 * 60); // At least 7 days

  // Use APP_URL scheme as primary check, fallback to NODE_ENV for resilience
  // This handles cases where APP_URL may not reflect runtime transport (e.g., HTTPS on localhost)
  const isSecure = envServer.APP_URL?.startsWith('https') ?? process.env.NODE_ENV !== 'development';

  // Set access token cookie
  response.cookies.set('propono_at', accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessTokenMaxAge,
  });

  // Set refresh token cookie
  response.cookies.set('propono_rt', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshTokenMaxAge,
  });

  // Set CSRF token cookie (not httpOnly so client can read it)
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: csrfMaxAge,
  });

  return response;
}

/**
 * PKCE / token-hash token exchange endpoint for Next.js App Router.
 *
 * Handles:
 * - token_hash + type (email | recovery) for PKCE Magic Link / password recovery
 * - code for OAuth PKCE code exchange
 *
 * Sets session cookies and redirects to validated next URL or error page.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const logger = createAuthRequestLogger();
  const cookieStore = await cookies();

  // Track route usage for migration monitoring
  recordAuthRouteUsage('confirm', 'success', { flow: 'started' });

  // Get parameters
  const tokenHash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  // Get redirect target (validate using existing sanitizeOAuthRedirect)
  const finalRedirect = sanitizeOAuthRedirect(nextParam, DEFAULT_FALLBACK_PATH);

  // Check for remember_me preference from cookie
  const rememberMeCookie = cookieStore.get('remember_me')?.value;
  const rememberMe = rememberMeCookie === 'true';

  logger.info('Auth confirm request', {
    hasTokenHash: !!tokenHash,
    hasType: !!typeParam,
    hasCode: !!code,
    nextParam,
    finalRedirect,
    rememberMe,
    route: 'confirm',
  });

  const supabase = supabaseAnonServer();

  try {
    // Handle token_hash flow (PKCE Magic Link / password recovery)
    if (tokenHash && typeParam) {
      const otpType = normalizeOtpType(typeParam);

      if (!otpType) {
        logger.error('Invalid OTP type in auth confirm', {
          type: typeParam,
          allowedTypes: EMAIL_OTP_TYPES,
        });
        recordMagicLinkCallback('failure', { reason: 'invalid_token_type' });
        recordAuthRouteUsage('confirm', 'failure', {
          flow: 'token_hash',
          error: 'invalid_token_type',
        });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      logger.info('Processing token_hash flow', {
        otpType,
        tokenHashLength: tokenHash.length,
      });

      // Verify OTP by token_hash
      // Type assertion needed due to Supabase typing differences
      const verifyParams: { token_hash: string; type: EmailOtpType } = {
        token_hash: tokenHash,
        type: otpType,
      };
      const { data, error } = await supabase.auth.verifyOtp(
        verifyParams as Parameters<typeof supabase.auth.verifyOtp>[0],
      );

      if (error || !data?.session) {
        logger.error('verifyOtp failed in auth confirm', {
          error: error?.message,
          otpType,
        });
        recordMagicLinkCallback('failure', { reason: 'verify_failed' });
        recordAuthRouteUsage('confirm', 'failure', {
          flow: 'token_hash',
          error: 'verify_failed',
          otpType,
        });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      const session = data.session;
      const accessToken = session.access_token ?? '';
      const refreshToken = session.refresh_token ?? '';
      const expiresIn = parseExpiresIn(session.expires_in ?? null);

      if (!accessToken || !refreshToken) {
        logger.error('verifyOtp returned missing tokens', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
        recordMagicLinkCallback('failure', { reason: 'missing_tokens' });
        recordAuthRouteUsage('confirm', 'failure', { flow: 'token_hash', error: 'missing_tokens' });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Extract user ID from access token
      const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
      const userId = payload?.sub ?? '';
      if (!userId) {
        logger.error('Failed to extract user ID from access token');
        recordMagicLinkCallback('failure', { reason: 'user_lookup_failed' });
        recordAuthRouteUsage('confirm', 'failure', {
          flow: 'token_hash',
          error: 'user_lookup_failed',
        });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Persist session to database (critical for session management)
      try {
        await persistSessionOpaque(userId, refreshToken, expiresIn, request, logger, rememberMe);
      } catch (error) {
        logger.error('Failed to persist session in auth confirm', error);
        recordMagicLinkCallback('failure', { reason: 'persist_failed' });
        recordAuthRouteUsage('confirm', 'failure', { flow: 'token_hash', error: 'persist_failed' });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Create CSRF token for the session
      const { value: csrfToken } = createCsrfToken();

      logger.info('Token_hash verification successful', {
        userId,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        expiresIn,
        rememberMe,
        finalRedirect,
        route: 'confirm',
      });

      recordMagicLinkCallback('success');
      recordAuthRouteUsage('confirm', 'success', {
        flow: 'token_hash',
        userId,
        otpType: typeParam,
      });

      // Redirect to init-session page with cookies set
      return redirectToWithCookies(
        finalRedirect,
        request,
        accessToken,
        refreshToken,
        expiresIn,
        csrfToken,
        userId,
        rememberMe,
      );
    }

    // Handle code flow (OAuth PKCE)
    if (code) {
      logger.info('Processing OAuth PKCE code exchange', {
        codeLength: code.length,
      });

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data?.session) {
        logger.error('exchangeCodeForSession failed in auth confirm', {
          error: error?.message,
        });
        recordAuthRouteUsage('confirm', 'failure', {
          flow: 'oauth_pkce',
          error: 'exchange_failed',
        });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      const session = data.session;
      const accessToken = session.access_token ?? '';
      const refreshToken = session.refresh_token ?? '';
      const expiresIn = parseExpiresIn(session.expires_in ?? null);

      if (!accessToken || !refreshToken) {
        logger.error('exchangeCodeForSession returned missing tokens', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
        recordAuthRouteUsage('confirm', 'failure', { flow: 'oauth_pkce', error: 'missing_tokens' });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Extract user ID from access token
      const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
      const userId = payload?.sub ?? '';
      if (!userId) {
        logger.error('Failed to extract user ID from access token');
        recordAuthRouteUsage('confirm', 'failure', {
          flow: 'oauth_pkce',
          error: 'user_lookup_failed',
        });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Persist session to database (critical for session management)
      try {
        await persistSessionOpaque(userId, refreshToken, expiresIn, request, logger, rememberMe);
      } catch (error) {
        logger.error('Failed to persist session in auth confirm (OAuth)', error);
        recordAuthRouteUsage('confirm', 'failure', { flow: 'oauth_pkce', error: 'persist_failed' });
        await clearAuthCookies();
        return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
          status: 302,
        });
      }

      // Create CSRF token for the session
      const { value: csrfToken } = createCsrfToken();

      logger.info('OAuth PKCE code exchange successful', {
        userId,
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        expiresIn,
        rememberMe,
        finalRedirect,
        route: 'confirm',
      });

      recordAuthRouteUsage('confirm', 'success', { flow: 'oauth_pkce', userId });

      // Redirect to init-session page with cookies set
      return redirectToWithCookies(
        finalRedirect,
        request,
        accessToken,
        refreshToken,
        expiresIn,
        csrfToken,
        userId,
        rememberMe,
      );
    }

    // No valid parameters provided
    logger.warn('No token_hash/type or code provided to /api/auth/confirm', {
      hasTokenHash: !!tokenHash,
      hasType: !!typeParam,
      hasCode: !!code,
    });
    await clearAuthCookies();
    return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
      status: 302,
    });
  } catch (error) {
    logger.error('Unexpected error in /api/auth/confirm', error);
    await clearAuthCookies();
    return NextResponse.redirect(new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(), {
      status: 302,
    });
  }
}
