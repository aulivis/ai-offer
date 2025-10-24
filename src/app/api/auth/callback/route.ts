import { createDecipheriv, createHash } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { EmailOtpType } from '@supabase/supabase-js';

import { envServer } from '@/env.server';

import { createAuthRequestLogger, type RequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkCallback } from '@/lib/observability/metrics';

import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';

import { setAuthCookies, setCSRFCookie } from '../../../../../lib/auth/cookies';

const AUTH_STATE_COOKIE = 'auth_state';
const AUTH_STATE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes
const AUTH_STATE_MAX_AGE_MS = AUTH_STATE_MAX_AGE_SECONDS * 1000;

type AuthStatePayload = {
  state?: string;
  nonce?: string;
  codeVerifier?: string;
  redirectTo?: string;
  createdAt?: number;
};

type ExchangeParams = {
  code: string;
  codeVerifier?: string;
};

type ExchangeResult = {
  accessToken: string;
  refreshToken: string;
};

type TokenHashExchangeParams = {
  tokenHash: string;
  type: EmailOtpType;
};

function decryptStateCookie(value: string, logger: RequestLogger): AuthStatePayload | null {
  try {
    const secret = createHash('sha256').update(envServer.AUTH_COOKIE_SECRET).digest();

    const buffer = Buffer.from(value, 'base64url');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', secret, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return JSON.parse(decrypted.toString('utf8')) as AuthStatePayload;
  } catch (error) {
    logger.error('Failed to decrypt OAuth state cookie.', error);
    return null;
  }
}

function sanitizeRedirect(target: string | null): string | null {
  if (!target) {
    return null;
  }

  if (target.startsWith('/')) {
    return target;
  }

  if (envServer.OAUTH_REDIRECT_ALLOWLIST.includes(target)) {
    return target;
  }

  try {
    const absolute = new URL(target);
    if (envServer.OAUTH_REDIRECT_ALLOWLIST.includes(absolute.toString())) {
      return absolute.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function buildRedirect(target: string) {
  return NextResponse.redirect(new URL(target, envServer.APP_URL));
}

const SENSITIVE_RESPONSE_KEYS = new Set([
  'access_token',
  'refresh_token',
  'provider_token',
  'token',
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, entry]) => {
        if (SENSITIVE_RESPONSE_KEYS.has(key) || /token/i.test(key)) {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = sanitizeValue(entry);
        }
        return acc;
      },
      {},
    );
  }

  if (typeof value === 'string' && /token/i.test(value)) {
    return '[REDACTED SENSITIVE CONTENT]';
  }

  return value;
}

async function exchangeCode(
  { code, codeVerifier }: ExchangeParams,
  logger: RequestLogger,
): Promise<ExchangeResult> {
  const grantType = codeVerifier ? 'pkce' : 'authorization_code';
  const endpoint = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  endpoint.searchParams.set('grant_type', grantType);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(
      codeVerifier ? { auth_code: code, code_verifier: codeVerifier } : { auth_code: code },
    ),
  });

  if (!response.ok) {
    const logDetails: Record<string, unknown> = {
      status: response.status,
      statusText: response.statusText,
    };

    try {
      const rawBody = await response.text();
      if (rawBody) {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(rawBody) as unknown;
            logDetails.body = sanitizeValue(parsed);
          } catch {
            logDetails.body = sanitizeValue(rawBody);
          }
        } else {
          logDetails.body = sanitizeValue(rawBody);
        }
      }
    } catch (bodyReadError) {
      logDetails.bodyReadError =
        bodyReadError instanceof Error ? bodyReadError.message : bodyReadError;
    }

    logger.error('Supabase token exchange failed.', undefined, logDetails);
    throw new Error(`Supabase token exchange failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!payload.access_token || !payload.refresh_token) {
    throw new Error('Supabase token exchange did not return required tokens.');
  }

  const result = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  };

  logger.info('Supabase token exchange succeeded.');
  return result;
}

async function exchangeTokenHash(
  { tokenHash, type }: TokenHashExchangeParams,
  logger: RequestLogger,
): Promise<ExchangeResult> {
  const supabase = supabaseAnonServer();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    logger.error('Supabase magic link token hash verification failed.', error);
    throw error;
  }

  const session = data.session;
  if (!session?.access_token || !session?.refresh_token) {
    throw new Error('Supabase magic link verification did not return required tokens.');
  }

  logger.info('Supabase magic link token hash verification succeeded.');

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

function validateStatePayload(
  stateParam: string | null,
  nonceParam: string | null,
  cookieValue: string | undefined,
  logger: RequestLogger,
): { redirectTo: string | null; codeVerifier?: string } | null {
  if (!stateParam) {
    return null;
  }

  if (!cookieValue) {
    logger.error('Missing OAuth state cookie during callback handling.');
    return null;
  }

  const payload = decryptStateCookie(cookieValue, logger);
  if (!payload || typeof payload.state !== 'string') {
    return null;
  }

  if (payload.state !== stateParam) {
    logger.error('OAuth state mismatch detected.');
    return null;
  }

  if (payload.createdAt === undefined || typeof payload.createdAt !== 'number') {
    logger.error('OAuth state payload missing creation timestamp.');
    return null;
  }

  if (Date.now() - payload.createdAt > AUTH_STATE_MAX_AGE_MS) {
    logger.error('OAuth state cookie has expired.');
    return null;
  }

  const expectedNonce = typeof payload.nonce === 'string' ? payload.nonce : null;
  if (expectedNonce) {
    if (!nonceParam) {
      logger.error('OAuth nonce parameter missing during callback handling.');
      return null;
    }

    if (nonceParam !== expectedNonce) {
      logger.error('OAuth nonce mismatch detected.');
      return null;
    }
  }

  const redirectTo = sanitizeRedirect(payload.redirectTo ?? null);
  const codeVerifier = typeof payload.codeVerifier === 'string' ? payload.codeVerifier : null;

  return {
    redirectTo,
    ...(codeVerifier ? { codeVerifier } : {}),
  };
}

function clearAuthStateCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set({
    name: AUTH_STATE_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const logger = createAuthRequestLogger();
  logger.info('Magic link callback request received.');

  const url = new URL(request.url);
  const emailParam = url.searchParams.get('email');
  if (emailParam) {
    logger.setEmail(emailParam);
    logger.info('Magic link callback includes email identifier.');
  }

  const cookieStore = await cookies();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const typeParam = (url.searchParams.get('type') ?? 'magiclink') as EmailOtpType;

  const stateParam = url.searchParams.get('state');
  const nonceParam = url.searchParams.get('nonce');
  const stateCookie = cookieStore.get(AUTH_STATE_COOKIE)?.value;

  const stateValidation = validateStatePayload(stateParam, nonceParam, stateCookie, logger);
  if (stateParam && !stateValidation) {
    clearAuthStateCookie(cookieStore);
    logger.error('Magic link callback state validation failed.', {
      hasNonce: Boolean(nonceParam),
      hadCookie: Boolean(stateCookie),
    });
    recordMagicLinkCallback('failure', { reason: 'state_validation' });
    return buildRedirect('/login?message=Unable%20to%20authenticate');
  }

  let redirectTarget = stateValidation?.redirectTo ?? null;
  const codeVerifier = stateValidation?.codeVerifier;

  if (!redirectTarget) {
    redirectTarget = sanitizeRedirect(url.searchParams.get('redirect_to'));
  }

  const finalRedirect = redirectTarget ?? '/dashboard';

  try {
    let exchangeResult: ExchangeResult | null = null;

    if (code) {
      const exchangeParams: ExchangeParams = { code };
      if (codeVerifier) {
        exchangeParams.codeVerifier = codeVerifier;
      }

      exchangeResult = await exchangeCode(exchangeParams, logger);
    } else if (tokenHash) {
      exchangeResult = await exchangeTokenHash({ tokenHash, type: typeParam }, logger);
    } else {
      logger.error('Magic link callback missing authorization credentials.');
      clearAuthStateCookie(cookieStore);
      recordMagicLinkCallback('failure', { reason: 'missing_code' });
      return buildRedirect('/login?message=Unable%20to%20authenticate');
    }

    await setAuthCookies(exchangeResult.accessToken, exchangeResult.refreshToken);
    await setCSRFCookie();
    recordMagicLinkCallback('success');
  } catch (error) {
    logger.error('Failed to exchange Supabase auth code.', error);
    clearAuthStateCookie(cookieStore);
    recordMagicLinkCallback('failure', { reason: 'exchange_error' });
    return buildRedirect('/login?message=Unable%20to%20authenticate');
  }

  clearAuthStateCookie(cookieStore);

  logger.info('Magic link callback completed successfully.', {
    redirect: finalRedirect,
  });

  return buildRedirect(finalRedirect);
}

export const __test = {
  exchangeCode: (params: ExchangeParams) => exchangeCode(params, createAuthRequestLogger()),
  sanitizeValue,
};
