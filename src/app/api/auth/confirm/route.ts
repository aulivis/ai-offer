import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { CSRF_COOKIE_NAME, createCsrfToken } from '@/lib/auth/csrf';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { createAuthRequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkCallback } from '@/lib/observability/metrics';

const AUTH_CONFIRM_ERROR_REDIRECT = '/login?message=Unable%20to%20authenticate';
const DEFAULT_FALLBACK_PATH = '/dashboard';
const REMEMBER_ME_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Email OTP types allowed for token_hash flow
const EMAIL_OTP_TYPES = ['email', 'recovery'] as const;
type EmailOtpType = typeof EMAIL_OTP_TYPES[number];

function normalizeOtpType(type: string | null): EmailOtpType | null {
  if (!type) return null;
  const normalized = type.trim().toLowerCase() as EmailOtpType | string;
  return EMAIL_OTP_TYPES.includes(normalized as EmailOtpType)
    ? (normalized as EmailOtpType)
    : null;
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
  return 3600; // Default 1 hour
}

/**
 * Creates a redirect response with authentication cookies set.
 * Uses Next.js's built-in cookie API to properly set cookies on redirect responses.
 * This matches the pattern used in the callback route.
 */
function redirectToWithCookies(
  path: string,
  request: NextRequest,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  csrfToken: string,
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

  // Create redirect response
  const response = NextResponse.redirect(absoluteUrl, { status: 302 });

  // Set cookies on the redirect response using Next.js API
  // Calculate maxAge values
  const accessTokenMaxAge = expiresIn;
  const refreshTokenMaxAge = rememberMe
    ? REMEMBER_ME_EXPIRES_IN_SECONDS
    : Math.max(expiresIn, 7 * 24 * 60 * 60); // At least 7 days
  const csrfMaxAge = rememberMe
    ? REMEMBER_ME_EXPIRES_IN_SECONDS
    : Math.max(accessTokenMaxAge, 7 * 24 * 60 * 60); // At least 7 days

  const isSecure = envServer.APP_URL.startsWith('https');

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
        await clearAuthCookies();
        return NextResponse.redirect(
          new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
          { status: 302 }
        );
      }

      logger.info('Processing token_hash flow', {
        otpType,
        tokenHashLength: tokenHash.length,
      });

      // Verify OTP by token_hash
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      } as any); // Type assertion needed due to Supabase typing differences

      if (error || !data?.session) {
        logger.error('verifyOtp failed in auth confirm', {
          error: error?.message,
          otpType,
        });
        recordMagicLinkCallback('failure', { reason: 'verify_failed' });
        await clearAuthCookies();
        return NextResponse.redirect(
          new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
          { status: 302 }
        );
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
        await clearAuthCookies();
        return NextResponse.redirect(
          new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
          { status: 302 }
        );
      }

      // Create CSRF token for the session
      const { value: csrfToken } = createCsrfToken();

      logger.info('Token_hash verification successful', {
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        expiresIn,
        rememberMe,
        finalRedirect,
      });

      recordMagicLinkCallback('success');

      // Redirect with cookies set
      return redirectToWithCookies(
        finalRedirect,
        request,
        accessToken,
        refreshToken,
        expiresIn,
        csrfToken,
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
        await clearAuthCookies();
        return NextResponse.redirect(
          new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
          { status: 302 }
        );
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
        await clearAuthCookies();
        return NextResponse.redirect(
          new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
          { status: 302 }
        );
      }

      // Create CSRF token for the session
      const { value: csrfToken } = createCsrfToken();

      logger.info('OAuth PKCE code exchange successful', {
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        expiresIn,
        rememberMe,
        finalRedirect,
      });

      // Redirect with cookies set
      return redirectToWithCookies(
        finalRedirect,
        request,
        accessToken,
        refreshToken,
        expiresIn,
        csrfToken,
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
    return NextResponse.redirect(
      new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
      { status: 302 }
    );
  } catch (error) {
    logger.error('Unexpected error in /api/auth/confirm', error);
    await clearAuthCookies();
    return NextResponse.redirect(
      new URL(AUTH_CONFIRM_ERROR_REDIRECT, request.url).toString(),
      { status: 302 }
    );
  }
}

