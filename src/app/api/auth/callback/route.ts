import { NextResponse } from 'next/server';
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
import { exchangeCode } from './exchangeCode';

const MAGIC_LINK_FAILURE_REDIRECT = '/login?message=Unable%20to%20authenticate';
const MISSING_AUTH_CODE_REDIRECT = '/login?message=Missing%20auth%20code';
const FALLBACK_EXPIRES_IN = 3600;
// Industry best practice: 30 days for "remember me" sessions
const REMEMBER_ME_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days

const ARGON2_OPTIONS: Argon2Options = {
  algorithm: Argon2Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Emailes OTP típusok (token_hash-hez kizárólag ezek engedettek)
const EMAIL_OTP_TYPES = [
  'magiclink',
  'recovery',
  'signup',
  'invite',
  'email_change',
  'email_change_new',
  'email_change_current',
] as const;
type EmailOtpTypeOnly = (typeof EMAIL_OTP_TYPES)[number];
const ALLOWED_OTP_TYPES = new Set<EmailOtpTypeOnly>(EMAIL_OTP_TYPES);

type MagicLinkTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type RedirectCookieOptions = {
  accessTokenMaxAge?: number;
  refreshTokenMaxAge?: number;
  rememberMe?: boolean;
  // Optionally pass tokens directly to ensure they're set on redirect
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
};

/**
 * Creates a redirect response with authentication cookies set.
 *
 * This function uses Next.js's built-in cookie API to properly set cookies
 * on the redirect response. This is the recommended approach for Next.js App Router.
 *
 * Key points:
 * - Cookies are set using response.cookies.set() which ensures they're properly
 *   included in the redirect response headers
 * - Uses SameSite=Lax to allow cookies on same-site redirects (required for magic link flows)
 * - Sets appropriate maxAge values based on rememberMe preference
 */
async function redirectTo(
  path: string,
  request?: Request,
  cookieStore?: Awaited<ReturnType<typeof cookies>>,
  cookieOptions?: RedirectCookieOptions,
) {
  // CRITICAL: Next.js NextResponse.redirect() requires absolute URLs.
  // We need to construct an absolute URL from the relative path.

  const isAbsolute = path.startsWith('http://') || path.startsWith('https://');
  let absoluteUrl: string;

  if (isAbsolute) {
    // Path is already absolute, use it directly
    absoluteUrl = path;
  } else {
    // Construct absolute URL from relative path
    // Prefer using the request's origin if available, otherwise use APP_URL
    let baseUrl: string;
    if (request) {
      try {
        const url = new URL(request.url);
        baseUrl = `${url.protocol}//${url.host}`;
      } catch {
        baseUrl = envServer.APP_URL;
      }
    } else {
      baseUrl = envServer.APP_URL;
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    absoluteUrl = `${baseUrl}${normalizedPath}`;
  }

  // Get tokens from options or cookie store
  const accessToken = cookieOptions?.accessToken;
  const refreshToken = cookieOptions?.refreshToken;
  const csrfToken = cookieOptions?.csrfToken;

  if (!accessToken || !refreshToken) {
    // No tokens to set - just redirect
    return NextResponse.redirect(absoluteUrl, { status: 302 });
  }

  const isSecure = envServer.APP_URL.startsWith('https');
  const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

  // Calculate maxAge values based on options or defaults
  const accessTokenMaxAge = cookieOptions?.accessTokenMaxAge ?? 3600; // 1 hour default
  const refreshTokenMaxAge = cookieOptions?.rememberMe
    ? REMEMBER_ME_MAX_AGE
    : (cookieOptions?.refreshTokenMaxAge ?? 7 * 24 * 60 * 60); // 7 days default
  const csrfMaxAge = cookieOptions?.rememberMe
    ? REMEMBER_ME_MAX_AGE
    : Math.max(accessTokenMaxAge, 7 * 24 * 60 * 60); // At least 7 days

  // Create redirect response first
  const response = NextResponse.redirect(absoluteUrl, { status: 302 });

  // CRITICAL: Use Next.js's response.cookies.set() API to set cookies on the redirect response
  // This is the recommended approach and ensures cookies are properly included in the response
  // The cookies will be sent with the redirect response, and the browser will store them
  // before following the redirect to the target URL

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
  if (csrfToken) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: csrfMaxAge,
    });
  }

  // Log for debugging
  const logger = createAuthRequestLogger();
  logger.info('Setting cookies on redirect response using Next.js API', {
    cookieCount: csrfToken ? 3 : 2,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasCsrfToken: !!csrfToken,
    accessTokenLength: accessToken.length,
    refreshTokenLength: refreshToken.length,
    redirectUrl: absoluteUrl,
    accessTokenMaxAge,
    refreshTokenMaxAge,
    rememberMe: cookieOptions?.rememberMe ?? false,
  });

  return response;
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

function normalizeOtpType(type: string | null): EmailOtpTypeOnly | null {
  if (!type) return null;
  const normalized = type.trim().toLowerCase() as EmailOtpTypeOnly | string;
  return ALLOWED_OTP_TYPES.has(normalized as EmailOtpTypeOnly)
    ? (normalized as EmailOtpTypeOnly)
    : null;
}

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

/** Gyors JWT payload decode (csak ACCESS tokenhez; REFRESH tokent nem dekódoljuk) */
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

type VerifyEmailTokenHashParams = { token_hash: string; type: EmailOtpTypeOnly };
type SupabaseAuthSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string };
};
type VerifyEmailTokenHashResponse = Promise<{
  data: { session: SupabaseAuthSession } | null;
  error: { message?: string } | null;
}>;

function verifyEmailTokenHash(
  supabase: ReturnType<typeof supabaseAnonServer>,
  params: VerifyEmailTokenHashParams,
): VerifyEmailTokenHashResponse {
  // Supabase types don't expose verifyOtp properly, so we need to cast
  // but we can use a more specific type than 'any'
  const fn = supabase.auth.verifyOtp as unknown as (
    p: VerifyEmailTokenHashParams,
  ) => VerifyEmailTokenHashResponse;
  return fn(params);
}

/** Session tárolás opaque refresh tokennel (nem dekódoljuk a refresh tokent) */
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
    logger.error('Failed to persist session record during login.', error);
    throw new Error('Unable to persist session record.');
  }

  logger.info('Session persisted or updated', {
    sessionId: data,
    userId,
  });
}

/** Magic link tokenek kezelése (implicit vagy verifyOtp) */
async function handleMagicLinkTokens(
  tokens: MagicLinkTokens,
  userId: string,
  redirectTarget: string,
  request: Request,
  logger: RequestLogger,
  rememberMe: boolean = false,
): Promise<void> {
  try {
    // Only persist session - don't set cookies here since we'll set them on redirect response
    await persistSessionOpaque(
      userId,
      tokens.refreshToken,
      tokens.expiresIn,
      request,
      logger,
      rememberMe,
    );
    recordMagicLinkCallback('success');
    // NOTE: Cookies are NOT set here - they will be set on the redirect response
    // This ensures cookies are included in the redirect response headers
  } catch (error) {
    recordMagicLinkCallback('failure', { reason: 'persist_or_cookie_failed' });
    await clearAuthCookies();
    logger.error('Unable to finalize magic link login.', error);
    throw error; // Let caller handle redirect
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();

  // Track route usage for migration monitoring
  recordAuthRouteUsage('callback', 'success', { flow: 'started' });

  // A végső redirect: először sütiből olvassuk (post_auth_redirect), ha nincs, a queryből, végül fallback
  const cookieRedirect = cookieStore.get('post_auth_redirect')?.value ?? '';
  const queryRedirect = url.searchParams.get('redirect_to');
  const finalRedirect = sanitizeOAuthRedirect(cookieRedirect || queryRedirect || '', '/dashboard');

  // Check for remember_me preference from cookie
  const rememberMeCookie = cookieStore.get('remember_me')?.value;
  const rememberMe = rememberMeCookie === 'true';

  const logger = createAuthRequestLogger();
  const supabase = supabaseAnonServer();

  // Magic link implicit (access_token + refresh_token + expires_in)
  const accessTokenFromLink = url.searchParams.get('access_token') ?? url.searchParams.get('token');
  const refreshTokenFromLink = url.searchParams.get('refresh_token');
  const expiresInFromLink = url.searchParams.get('expires_in');

  // Log raw URL parameters for debugging
  logger.info('Magic link callback URL parameters', {
    hasAccessToken: !!accessTokenFromLink,
    hasRefreshToken: !!refreshTokenFromLink,
    hasExpiresIn: !!expiresInFromLink,
    accessTokenLength: accessTokenFromLink?.length ?? 0,
    refreshTokenLength: refreshTokenFromLink?.length ?? 0,
    refreshTokenPreview: refreshTokenFromLink ? refreshTokenFromLink.substring(0, 50) : null,
    expiresIn: expiresInFromLink,
    urlSearchParams: Object.fromEntries(url.searchParams.entries()),
  });

  if (accessTokenFromLink) {
    if (!refreshTokenFromLink) {
      logger.error('Missing refresh_token in magic link callback', {
        urlSearchParams: Object.fromEntries(url.searchParams.entries()),
      });
      recordMagicLinkCallback('failure', { reason: 'missing_refresh_token' });
      await clearAuthCookies();
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    // Validate refresh token length (Supabase refresh tokens should be reasonably long)
    // A 12-character token is suspiciously short and might indicate a parsing issue
    if (refreshTokenFromLink.length < 20) {
      logger.warn('Refresh token appears to be unusually short', {
        refreshTokenLength: refreshTokenFromLink.length,
        refreshTokenPreview: refreshTokenFromLink.substring(0, 50),
        fullUrl: request.url,
      });
    }

    const payload = decodeJwtPayload<{ sub?: string }>(accessTokenFromLink);
    const userId = payload?.sub ?? '';
    if (!userId) {
      recordMagicLinkCallback('failure', { reason: 'user_lookup_failed' });
      await clearAuthCookies();
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    const tokens: MagicLinkTokens = {
      accessToken: accessTokenFromLink,
      refreshToken: refreshTokenFromLink!,
      expiresIn: parseExpiresIn(expiresInFromLink),
    };

    // Log token lengths for debugging
    logger.info('Parsed tokens from URL', {
      accessTokenLength: tokens.accessToken.length,
      refreshTokenLength: tokens.refreshToken.length,
      expiresIn: tokens.expiresIn,
      refreshTokenPreview:
        tokens.refreshToken.substring(0, 20) + (tokens.refreshToken.length > 20 ? '...' : ''),
    });

    try {
      logger.info('Processing magic link tokens', {
        userId,
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });

      // Persist session (but don't set cookies here - they'll be set on redirect response)
      await handleMagicLinkTokens(tokens, userId, finalRedirect, request, logger, rememberMe);

      // Create CSRF token for the session
      // We need to generate it here so we can include it in the redirect
      const { value: csrfTokenValue } = createCsrfToken();

      // Track successful callback route usage
      recordAuthRouteUsage('callback', 'success', { flow: 'implicit', userId });

      // Redirect to init-session page for client-side session initialization
      // Build the redirect path (will be converted to absolute URL by redirectTo)
      const redirectPath = `/auth/init-session?redirect=${encodeURIComponent(finalRedirect)}&user_id=${encodeURIComponent(userId)}`;

      logger.info('Preparing redirect to init-session with cookies', {
        userId,
        redirectPath,
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length,
        expiresIn: tokens.expiresIn,
        rememberMe,
        hasCsrfToken: !!csrfTokenValue,
        route: 'callback',
      });

      // Pass tokens directly to redirectTo to set cookies on redirect response
      // This ensures cookies are included in Set-Cookie headers of the redirect
      return redirectTo(redirectPath, request, cookieStore, {
        accessTokenMaxAge: tokens.expiresIn,
        refreshTokenMaxAge: rememberMe
          ? REMEMBER_ME_EXPIRES_IN_SECONDS
          : Math.max(tokens.expiresIn || 3600, 7 * 24 * 60 * 60),
        rememberMe,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        csrfToken: csrfTokenValue,
      });
    } catch (error) {
      logger.error('Error in magic link token handling', error);
      recordAuthRouteUsage('callback', 'failure', {
        flow: 'implicit',
        error: 'token_handling_failed',
      });
      // Ensure cookies are cleared on error
      await clearAuthCookies();
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }
  }

  // Magic link verifyOtp (token_hash)
  const tokenHash = url.searchParams.get('token_hash');
  if (tokenHash) {
    const otpType = normalizeOtpType(url.searchParams.get('type'));
    if (!otpType) {
      recordMagicLinkCallback('failure', { reason: 'invalid_token_type' });
      await clearAuthCookies();
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    try {
      const params: VerifyEmailTokenHashParams = { token_hash: tokenHash, type: otpType };
      const { data, error } = await verifyEmailTokenHash(supabase, params);

      if (error || !data?.session) {
        recordMagicLinkCallback('failure', { reason: 'verify_failed' });
        logger.error('Supabase verifyOtp failed.', error ?? undefined);
        await clearAuthCookies();
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
      }

      const session = data.session;
      const accessToken = session.access_token ?? '';
      const refreshToken = session.refresh_token ?? '';
      const expiresIn = parseExpiresIn(session.expires_in ?? null);

      if (!accessToken || !refreshToken) {
        recordMagicLinkCallback('failure', { reason: 'missing_tokens' });
        logger.error('Supabase verifyOtp returned missing tokens.');
        await clearAuthCookies();
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
      }

      const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
      const userId = payload?.sub ?? '';
      if (!userId) {
        recordMagicLinkCallback('failure', { reason: 'user_lookup_failed' });
        await clearAuthCookies();
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
      }

      // For magic link flows, also use the init-session page to ensure client session is ready
      // This provides consistent behavior across all auth flows
      try {
        logger.info('Processing magic link tokens (token_hash flow)', {
          userId,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresIn,
        });

        // Persist session (but don't set cookies here - they'll be set on redirect response)
        await handleMagicLinkTokens(
          { accessToken, refreshToken, expiresIn },
          userId,
          finalRedirect,
          request,
          logger,
          rememberMe,
        );

        // Create CSRF token for the session
        const { value: csrfTokenValue } = createCsrfToken();

        // Track successful callback route usage
        recordAuthRouteUsage('callback', 'success', { flow: 'token_hash', userId });

        // Redirect to init-session page for client-side session initialization
        // Build redirect path (will be converted to absolute URL by redirectTo)
        const redirectPath = `/auth/init-session?redirect=${encodeURIComponent(finalRedirect)}&user_id=${encodeURIComponent(userId)}`;

        logger.info('Redirecting to init-session (token_hash flow) with cookies', {
          userId,
          redirectPath,
          expiresIn,
          rememberMe,
          accessTokenLength: accessToken.length,
          refreshTokenLength: refreshToken.length,
          hasCsrfToken: !!csrfTokenValue,
          route: 'callback',
        });

        // Pass tokens directly to ensure they're set on the redirect response
        return redirectTo(redirectPath, request, cookieStore, {
          accessTokenMaxAge: expiresIn,
          refreshTokenMaxAge: rememberMe
            ? REMEMBER_ME_EXPIRES_IN_SECONDS
            : Math.max(expiresIn || 3600, 7 * 24 * 60 * 60),
          rememberMe,
          accessToken,
          refreshToken,
          csrfToken: csrfTokenValue,
        });
      } catch (handleError) {
        logger.error('Error in magic link token handling (token_hash flow)', handleError);
        recordAuthRouteUsage('callback', 'failure', {
          flow: 'token_hash',
          error: 'token_handling_failed',
        });
        // Ensure cookies are cleared on error
        await clearAuthCookies();
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
      }
    } catch (error) {
      recordMagicLinkCallback('failure', { reason: 'verify_error' });
      logger.error('Unexpected error while verifying magic link token.', error);
      await clearAuthCookies();
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }
  }

  // Google OAuth PKCE code exchange
  const code = url.searchParams.get('code');
  if (!code) {
    return redirectTo(MISSING_AUTH_CODE_REDIRECT, request);
  }

  try {
    const verifierCookie = cookieStore.get('sb_pkce_code_verifier')?.value ?? null;

    if (!verifierCookie) {
      logger.error('Missing PKCE code verifier cookie at callback');
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    const redirectUriForExchange = new URL(envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI);
    redirectUriForExchange.searchParams.set('redirect_to', finalRedirect);

    const exchange = await exchangeCode(
      {
        code,
        codeVerifier: verifierCookie,
        redirectUri: redirectUriForExchange.toString(),
      },
      logger,
    );

    // PKCE süti törlése
    cookieStore.set({
      name: 'sb_pkce_code_verifier',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

    const accessToken = exchange.access_token ?? '';
    const refreshToken = exchange.refresh_token ?? '';
    const expiresIn = parseExpiresIn(exchange.expires_in ?? null);

    if (!accessToken || !refreshToken) {
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
    const userId = payload?.sub ?? '';
    if (!userId) {
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
    }

    // Persist session (but don't set cookies here - they'll be set on redirect response)
    await persistSessionOpaque(userId, refreshToken, expiresIn, request, logger, rememberMe);

    // Create CSRF token for the session
    const { value: csrfTokenValue } = createCsrfToken();

    // Track successful callback route usage
    recordAuthRouteUsage('callback', 'success', { flow: 'oauth_pkce', userId });

    // For OAuth flows, redirect to client-side session initialization page
    // This ensures the Supabase client session is properly initialized before
    // redirecting to the final destination (dashboard, etc.)
    const initSessionPath = `/auth/init-session?redirect=${encodeURIComponent(finalRedirect)}&user_id=${encodeURIComponent(userId)}`;

    logger.info('Redirecting OAuth callback to init-session with cookies', {
      userId,
      redirectPath: initSessionPath,
      expiresIn,
      rememberMe,
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      hasCsrfToken: !!csrfTokenValue,
      route: 'callback',
    });

    // Pass tokens directly to ensure they're set on the redirect response
    return redirectTo(initSessionPath, request, cookieStore, {
      accessTokenMaxAge: expiresIn,
      refreshTokenMaxAge: rememberMe
        ? REMEMBER_ME_EXPIRES_IN_SECONDS
        : Math.max(expiresIn || 3600, 7 * 24 * 60 * 60),
      rememberMe,
      accessToken,
      refreshToken,
      csrfToken: csrfTokenValue,
    });
  } catch (error) {
    logger.error('Failed to complete OAuth callback', error);
    recordAuthRouteUsage('callback', 'failure', {
      flow: 'oauth_pkce',
      error: 'oauth_callback_failed',
    });
    await clearAuthCookies();
    return redirectTo(MAGIC_LINK_FAILURE_REDIRECT, request);
  }
}
