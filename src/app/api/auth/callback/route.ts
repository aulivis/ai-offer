import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { clearAuthCookies, setAuthCookies } from '../../../../../lib/auth/cookies';
import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { supabaseServiceRole } from '../../../lib/supabaseServiceRole';
import { createAuthRequestLogger, type RequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkCallback } from '@/lib/observability/metrics';
import {
  Argon2Algorithm,
  argon2Hash,
  type Argon2Options,
} from '../../../../../lib/auth/argon2';

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
type EmailOtpTypeOnly = typeof EMAIL_OTP_TYPES[number];
const ALLOWED_OTP_TYPES = new Set<EmailOtpTypeOnly>(EMAIL_OTP_TYPES);

type MagicLinkTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ExchangeCodeParams = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

type ExchangeCodeResult = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, envServer.APP_URL));
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

function redactJsonTokens(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactJsonTokens(item));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, entryValue]) => {
        if (/token|secret|key/i.test(key)) {
          acc[key] = '[REDACTED]';
          return acc;
        }
        acc[key] = redactJsonTokens(entryValue);
        return acc;
      },
      {},
    );
  }
  return value;
}

function sanitizeErrorBody(contentType: string, rawBody: string): unknown {
  if (!rawBody) {
    return null;
  }
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      return redactJsonTokens(parsed);
    } catch {
      return '[INVALID JSON]';
    }
  }
  if (/token|secret|key/i.test(rawBody)) {
    return '[REDACTED SENSITIVE CONTENT]';
  }
  return rawBody;
}

/** Gyors JWT payload decode (csak ACCESS tokenhez; REFRESH tokent nem dekódoljuk) */
function decodeJwtPayload<T = Record<string, unknown>>(jwt: string): T | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const json = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** PKCE token csere a Supabase GoTrue felé (JSON formátum, grant_type=pkce) */
async function exchangeCode(
  { code, codeVerifier, redirectUri }: ExchangeCodeParams,
  logger: RequestLogger,
) {
  const url = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set('grant_type', 'pkce');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = await response.text();

  if (!response.ok) {
    logger.error('Supabase token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      body: sanitizeErrorBody(contentType, rawBody),
    });
    throw new Error(`Supabase token exchange failed with status ${response.status}`);
  }

  try {
    return rawBody ? (JSON.parse(rawBody) as ExchangeCodeResult) : ({} as ExchangeCodeResult);
  } catch (error) {
    logger.error('Supabase token exchange returned invalid JSON', error);
    throw new Error('Supabase token exchange returned invalid JSON.');
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
  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    rt_hash: hashedRefresh,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    ip: getClientIp(request),
    ua: request.headers.get('user-agent'),
  });

  if (error) {
    logger.error('Failed to persist session record during login.', error);
    throw new Error('Unable to persist session record.');
  }
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
    await persistSessionOpaque(userId, tokens.refreshToken, tokens.expiresIn, request, logger, rememberMe);
    await setAuthCookies(tokens.accessToken, tokens.refreshToken, {
      accessTokenMaxAgeSeconds: tokens.expiresIn,
      rememberMe,
    });
    recordMagicLinkCallback('success');
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

  if (accessTokenFromLink) {
    if (!refreshTokenFromLink) {
      recordMagicLinkCallback('failure', { reason: 'missing_refresh_token' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const payload = decodeJwtPayload<{ sub?: string }>(accessTokenFromLink);
    const userId = payload?.sub ?? '';
    if (!userId) {
      recordMagicLinkCallback('failure', { reason: 'user_lookup_failed' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const tokens: MagicLinkTokens = {
      accessToken: accessTokenFromLink,
      refreshToken: refreshTokenFromLink!,
      expiresIn: parseExpiresIn(expiresInFromLink),
    };

    // Végcél sütit töröljük
    cookieStore.set({
      name: 'post_auth_redirect',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

      // Clean up remember_me cookie
      cookieStore.set({
        name: 'remember_me',
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: envServer.APP_URL.startsWith('https'),
        path: '/',
        maxAge: 0,
      });

      try {
        await handleMagicLinkTokens(tokens, userId, finalRedirect, request, logger, rememberMe);
        
        // Redirect to init-session page for client-side session initialization
        const initSessionUrl = new URL('/auth/init-session', envServer.APP_URL);
        initSessionUrl.searchParams.set('redirect', finalRedirect);
        initSessionUrl.searchParams.set('user_id', userId);
        
        return redirectTo(initSessionUrl.pathname + initSessionUrl.search);
      } catch (error) {
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }
  }

  // Magic link verifyOtp (token_hash)
  const tokenHash = url.searchParams.get('token_hash');
  if (tokenHash) {
    const otpType = normalizeOtpType(url.searchParams.get('type'));
    if (!otpType) {
      recordMagicLinkCallback('failure', { reason: 'invalid_token_type' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    try {
      const params: VerifyEmailTokenHashParams = { token_hash: tokenHash, type: otpType };
      const { data, error } = await verifyEmailTokenHash(supabase, params);

      if (error || !data?.session) {
        recordMagicLinkCallback('failure', { reason: 'verify_failed' });
        logger.error('Supabase verifyOtp failed.', error ?? undefined);
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }

      const session = data.session;
      const accessToken = session.access_token ?? '';
      const refreshToken = session.refresh_token ?? '';
      const expiresIn = parseExpiresIn(session.expires_in ?? null);

      if (!accessToken || !refreshToken) {
        recordMagicLinkCallback('failure', { reason: 'missing_tokens' });
        logger.error('Supabase verifyOtp returned missing tokens.');
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }

      const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
      const userId = payload?.sub ?? '';
      if (!userId) {
        recordMagicLinkCallback('failure', { reason: 'user_lookup_failed' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }

      // Végcél sütit töröljük
      cookieStore.set({
        name: 'post_auth_redirect',
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: envServer.APP_URL.startsWith('https'),
        path: '/',
        maxAge: 0,
      });

      // Clean up remember_me cookie
      cookieStore.set({
        name: 'remember_me',
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: envServer.APP_URL.startsWith('https'),
        path: '/',
        maxAge: 0,
      });

      // For magic link flows, also use the init-session page to ensure client session is ready
      // This provides consistent behavior across all auth flows
      await handleMagicLinkTokens(
        { accessToken, refreshToken, expiresIn },
        userId,
        finalRedirect,
        request,
        logger,
        rememberMe,
      );
      
      // Redirect to init-session page for client-side session initialization
      // This ensures the Supabase client session is properly initialized
      const initSessionUrl = new URL('/auth/init-session', envServer.APP_URL);
      initSessionUrl.searchParams.set('redirect', finalRedirect);
      initSessionUrl.searchParams.set('user_id', userId);
      
      return redirectTo(initSessionUrl.pathname + initSessionUrl.search);
    } catch (error) {
      recordMagicLinkCallback('failure', { reason: 'verify_error' });
      logger.error('Unexpected error while verifying magic link token.', error);
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }
  }

  // Google OAuth PKCE code exchange
  const code = url.searchParams.get('code');
  if (!code) {
    return redirectTo(MISSING_AUTH_CODE_REDIRECT);
  }

  try {
    const verifierCookie = cookieStore.get('sb_pkce_code_verifier')?.value ?? null;

    if (!verifierCookie) {
      logger.error('Missing PKCE code verifier cookie at callback');
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
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
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const payload = decodeJwtPayload<{ sub?: string }>(accessToken);
    const userId = payload?.sub ?? '';
    if (!userId) {
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    await persistSessionOpaque(userId, refreshToken, expiresIn, request, logger, rememberMe);
    await setAuthCookies(accessToken, refreshToken, {
      accessTokenMaxAgeSeconds: expiresIn,
      rememberMe,
    });

    // Végcél sütit töröljük
    cookieStore.set({
      name: 'post_auth_redirect',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

    // Clean up remember_me cookie
    cookieStore.set({
      name: 'remember_me',
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

    // For OAuth flows, redirect to client-side session initialization page
    // This ensures the Supabase client session is properly initialized before
    // redirecting to the final destination (dashboard, etc.)
    const initSessionUrl = new URL('/auth/init-session', envServer.APP_URL);
    initSessionUrl.searchParams.set('redirect', finalRedirect);
    initSessionUrl.searchParams.set('user_id', userId);
    
    return redirectTo(initSessionUrl.pathname + initSessionUrl.search);
  } catch (error) {
    logger.error('Failed to complete OAuth callback', error);
    await clearAuthCookies();
    return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
  }
}

export const __test = {
  exchangeCode,
};
