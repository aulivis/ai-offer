import { createCipheriv, createHash, randomBytes } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { envServer } from '@/env.server';

const AUTH_STATE_COOKIE = 'auth_state';
const AUTH_STATE_MAX_AGE = 10 * 60; // 10 minutes

function normalizeUrl(target: string): string | null {
  try {
    return new URL(target).toString();
  } catch {
    return null;
  }
}

function getFallbackRedirect(): string {
  const [firstAllowlisted] = envServer.OAUTH_REDIRECT_ALLOWLIST;
  if (firstAllowlisted) {
    const normalized = normalizeUrl(firstAllowlisted);
    if (normalized) {
      return normalized;
    }
  }

  return new URL('/dashboard', envServer.APP_URL).toString();
}

function encryptState(payload: Record<string, unknown>): string {
  const secret = createHash('sha256')
    .update(envServer.SUPABASE_SERVICE_ROLE_KEY)
    .digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);

  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

function pickRedirectTarget(requested: string | null): string {
  const allowlist = envServer.OAUTH_REDIRECT_ALLOWLIST;
  const fallback = getFallbackRedirect();

  if (!requested) {
    return fallback;
  }

  const normalizedRequested = normalizeUrl(requested);
  if (!normalizedRequested) {
    return fallback;
  }

  if (allowlist.length === 0) {
    try {
      const allowedOrigin = new URL(envServer.APP_URL).origin;
      const requestedOrigin = new URL(normalizedRequested).origin;
      return allowedOrigin === requestedOrigin ? normalizedRequested : fallback;
    } catch {
      return fallback;
    }
  }

  const normalizedAllowlist = new Set(
    allowlist
      .map((target) => normalizeUrl(target))
      .filter((target): target is string => Boolean(target)),
  );

  return normalizedAllowlist.has(normalizedRequested) ? normalizedRequested : fallback;
}

export async function GET(request: Request) {
  const redirectTo = pickRedirectTarget(new URL(request.url).searchParams.get('redirect_to'));

  const supabase = supabaseServer();
  const state = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      flowType: 'pkce',
      skipBrowserRedirect: true,
      redirectTo,
    },
  });

  if (error || !data?.url || !data.codeVerifier) {
    console.error('Failed to initiate Supabase Google OAuth flow.', error ?? null);
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const authorizeUrl = new URL(data.url);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('nonce', nonce);

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_STATE_COOKIE,
    value: encryptState({
      state,
      nonce,
      codeVerifier: data.codeVerifier,
      redirectTo,
      createdAt: Date.now(),
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_STATE_MAX_AGE,
  });

  return NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
}
