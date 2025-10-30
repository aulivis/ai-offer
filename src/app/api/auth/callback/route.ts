import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { clearAuthCookies, setAuthCookies } from '../../../../../lib/auth/cookies';
import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { supabaseServiceRole } from '../../../lib/supabaseServiceRole';
import { createAuthRequestLogger, type RequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkCallback } from '@/lib/observability/metrics';
import { Argon2Algorithm, argon2Hash, type Argon2Options } from '../../../../../lib/auth/argon2';
import { decodeRefreshToken } from '../token';

const MAGIC_LINK_FAILURE_REDIRECT = '/login?message=Unable%20to%20authenticate';
const MISSING_AUTH_CODE_REDIRECT = '/login?message=Missing%20auth%20code';
const FALLBACK_EXPIRES_IN = 3600;

const ARGON2_OPTIONS: Argon2Options = {
  algorithm: Argon2Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const ALLOWED_OTP_TYPES = new Set([
  'magiclink',
  'recovery',
  'signup',
  'invite',
  'email_change',
  'email_change_new',
  'email_change_current',
]);

type VerifyOtpParams = Parameters<ReturnType<typeof supabaseAnonServer>['auth']['verifyOtp']>[0];

type MagicLinkTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ExchangeCodeParams = {
  code: string;
  codeVerifier: string;
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

function normalizeOtpType(type: string | null): string | null {
  if (!type) {
    return null;
  }
  const normalized = type.trim().toLowerCase();
  return ALLOWED_OTP_TYPES.has(normalized) ? normalized : null;
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
  if (realIp) {
    return realIp;
  }

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

async function exchangeCode({ code, codeVerifier }: ExchangeCodeParams) {
  const tokenUrl = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  tokenUrl.searchParams.set('grant_type', 'pkce');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
      redirect_uri: envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI,
    }),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = await response.text();

  if (!response.ok) {
    console.error('Supabase token exchange failed.', {
      status: response.status,
      statusText: response.statusText,
      body: sanitizeErrorBody(contentType, rawBody),
    });
    throw new Error(`Supabase token exchange failed with status ${response.status}`);
  }

  if (!contentType.includes('application/json')) {
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as ExchangeCodeResult;
        return parsed;
      } catch (error) {
        console.error('Supabase token exchange returned an unexpected payload.', error);
        throw new Error('Supabase token exchange returned an unexpected payload.');
      }
    }
    return {} satisfies ExchangeCodeResult;
  }

  try {
    const parsed = rawBody ? JSON.parse(rawBody) : {};
    return parsed as ExchangeCodeResult;
  } catch (error) {
    console.error('Supabase token exchange returned invalid JSON.', error);
    throw new Error('Supabase token exchange returned invalid JSON.');
  }
}

async function persistSession(refreshToken: string, request: Request, logger: RequestLogger) {
  const decoded = decodeRefreshToken(refreshToken);
  const userId = decoded?.sub ?? null;
  const issuedAt = decoded?.iat ? new Date(decoded.iat * 1000) : null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  if (!userId || !issuedAt || !expiresAt) {
    throw new Error('Refresh token missing required claims.');
  }

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

async function handleMagicLinkTokens(
  tokens: MagicLinkTokens,
  redirectTarget: string,
  request: Request,
  logger: RequestLogger,
) {
  try {
    await persistSession(tokens.refreshToken, request, logger);
  } catch (error) {
    recordMagicLinkCallback('failure', { reason: 'session_persist_failed' });
    await clearAuthCookies();
    logger.error('Unable to persist session for magic link login.', error);
    return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
  }

  try {
    await setAuthCookies(tokens.accessToken, tokens.refreshToken, {
      accessTokenMaxAgeSeconds: tokens.expiresIn,
    });
  } catch (error) {
    recordMagicLinkCallback('failure', { reason: 'cookie_set_failed' });
    await clearAuthCookies();
    logger.error('Unable to finalize magic link login.', error);
    return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
  }

  recordMagicLinkCallback('success');
  return redirectTo(redirectTarget);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const finalRedirect = sanitizeOAuthRedirect(url.searchParams.get('redirect_to'), '/dashboard');
  const logger = createAuthRequestLogger();

  const accessTokenFromLink = url.searchParams.get('access_token') ?? url.searchParams.get('token');
  const refreshTokenFromLink = url.searchParams.get('refresh_token');
  const expiresInFromLink = url.searchParams.get('expires_in');

  if (accessTokenFromLink) {
    if (!refreshTokenFromLink) {
      recordMagicLinkCallback('failure', { reason: 'missing_refresh_token' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const tokens: MagicLinkTokens = {
      accessToken: accessTokenFromLink,
      refreshToken: refreshTokenFromLink,
      expiresIn: parseExpiresIn(expiresInFromLink),
    };

    return handleMagicLinkTokens(tokens, finalRedirect, request, logger);
  }

  const tokenHash = url.searchParams.get('token_hash');
  if (tokenHash) {
    const otpType = normalizeOtpType(url.searchParams.get('type'));
    if (!otpType) {
      recordMagicLinkCallback('failure', { reason: 'invalid_token_type' });
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    try {
      const supabase = supabaseAnonServer();
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as VerifyOtpParams['type'],
      });

      if (error || !data?.session) {
        recordMagicLinkCallback('failure', { reason: 'verify_failed' });
        logger.error('Supabase verifyOtp failed.', error ?? undefined);
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }

      const session = data.session;
      const accessToken = session.access_token ?? '';
      const refreshToken = session.refresh_token ?? '';

      if (!accessToken || !refreshToken) {
        recordMagicLinkCallback('failure', { reason: 'missing_tokens' });
        logger.error('Supabase verifyOtp returned missing tokens.');
        return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
      }

      const expiresIn = parseExpiresIn(session.expires_in ?? null);

      return handleMagicLinkTokens(
        { accessToken, refreshToken, expiresIn },
        finalRedirect,
        request,
        logger,
      );
    } catch (error) {
      recordMagicLinkCallback('failure', { reason: 'verify_error' });
      logger.error('Unexpected error while verifying magic link token.', error);
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return redirectTo(MISSING_AUTH_CODE_REDIRECT);
  }

  try {
    const cookieStore = await cookies();
    const verifierCookie = cookieStore.get('sb_pkce_code_verifier')?.value ?? null;

    if (!verifierCookie) {
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const exchange = await exchangeCode({ code, codeVerifier: verifierCookie });

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

    if (!accessToken || !refreshToken) {
      return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
    }

    const expiresIn = parseExpiresIn(exchange.expires_in ?? null);

    await persistSession(refreshToken, request, logger);
    await setAuthCookies(accessToken, refreshToken, {
      accessTokenMaxAgeSeconds: expiresIn,
    });

    return redirectTo(finalRedirect);
  } catch (error) {
    console.error('Failed to complete OAuth callback.', error);
    await clearAuthCookies();
    return redirectTo(MAGIC_LINK_FAILURE_REDIRECT);
  }
}

export const __test = {
  exchangeCode,
};
