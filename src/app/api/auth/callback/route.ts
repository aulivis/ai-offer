import { createDecipheriv, createHash } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { envServer } from '@/env.server';

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

function decryptStateCookie(value: string): AuthStatePayload | null {
  try {
    const secret = createHash('sha256')
      .update(envServer.SUPABASE_SERVICE_ROLE_KEY)
      .digest();

    const buffer = Buffer.from(value, 'base64url');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', secret, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as AuthStatePayload;
  } catch (error) {
    console.error('Failed to decrypt OAuth state cookie.', error);
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

async function exchangeCode({ code, codeVerifier }: ExchangeParams): Promise<ExchangeResult> {
  const grantType = codeVerifier ? 'pkce' : 'authorization_code';
  const endpoint = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  endpoint.searchParams.set('grant_type', grantType);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(
      codeVerifier
        ? { auth_code: code, code_verifier: codeVerifier }
        : { auth_code: code },
    ),
  });

  if (!response.ok) {
    throw new Error(`Supabase token exchange failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!payload.access_token || !payload.refresh_token) {
    throw new Error('Supabase token exchange did not return required tokens.');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  };
}

function validateStatePayload(
  stateParam: string | null,
  nonceParam: string | null,
  cookieValue: string | undefined,
): { redirectTo: string | null; codeVerifier?: string } | null {
  if (!stateParam) {
    return null;
  }

  if (!cookieValue) {
    console.error('Missing OAuth state cookie during callback handling.');
    return null;
  }

  const payload = decryptStateCookie(cookieValue);
  if (!payload || typeof payload.state !== 'string') {
    return null;
  }

  if (payload.state !== stateParam) {
    console.error('OAuth state mismatch detected.');
    return null;
  }

  if (payload.createdAt === undefined || typeof payload.createdAt !== 'number') {
    console.error('OAuth state payload missing creation timestamp.');
    return null;
  }

  if (Date.now() - payload.createdAt > AUTH_STATE_MAX_AGE_MS) {
    console.error('OAuth state cookie has expired.');
    return null;
  }

  const expectedNonce = typeof payload.nonce === 'string' ? payload.nonce : null;
  if (expectedNonce) {
    if (!nonceParam) {
      console.error('OAuth nonce parameter missing during callback handling.');
      return null;
    }

    if (nonceParam !== expectedNonce) {
      console.error('OAuth nonce mismatch detected.');
      return null;
    }
  }

  return {
    redirectTo: sanitizeRedirect(payload.redirectTo ?? null),
    codeVerifier: typeof payload.codeVerifier === 'string' ? payload.codeVerifier : undefined,
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
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const cookieStore = await cookies();

  if (!code) {
    clearAuthStateCookie(cookieStore);
    return buildRedirect('/login?message=Unable%20to%20authenticate');
  }

  const stateParam = url.searchParams.get('state');
  const nonceParam = url.searchParams.get('nonce');
  const stateCookie = cookieStore.get(AUTH_STATE_COOKIE)?.value;

  const stateValidation = validateStatePayload(stateParam, nonceParam, stateCookie);
  if (stateParam && !stateValidation) {
    clearAuthStateCookie(cookieStore);
    return buildRedirect('/login?message=Unable%20to%20authenticate');
  }

  let redirectTarget = stateValidation?.redirectTo ?? null;
  const codeVerifier = stateValidation?.codeVerifier;

  if (!redirectTarget) {
    redirectTarget = sanitizeRedirect(url.searchParams.get('redirect_to'));
  }

  const finalRedirect = redirectTarget ?? '/dashboard';

  try {
    const { accessToken, refreshToken } = await exchangeCode({
      code,
      codeVerifier,
    });

    await setAuthCookies(accessToken, refreshToken);
    await setCSRFCookie();
  } catch (error) {
    console.error('Failed to exchange Supabase auth code.', error);
    clearAuthStateCookie(cookieStore);
    return buildRedirect('/login?message=Unable%20to%20authenticate');
  }

  clearAuthStateCookie(cookieStore);

  return buildRedirect(finalRedirect);
}
