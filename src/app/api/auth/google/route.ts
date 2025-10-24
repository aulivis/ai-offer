import { createCipheriv, createHash, randomBytes } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { envServer } from '@/env.server';

import { createSupabaseOAuthClient } from './createSupabaseOAuthClient';
import { sanitizeOAuthRedirect } from './redirectUtils';

const AUTH_STATE_COOKIE = 'auth_state';
const AUTH_STATE_MAX_AGE = 10 * 60; // 10 minutes

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

export async function GET(request: Request) {
  const redirectTo = sanitizeOAuthRedirect(
    new URL(request.url).searchParams.get('redirect_to'),
    '/dashboard',
  );

  const { client: supabase, consumeCodeVerifier } = createSupabaseOAuthClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      skipBrowserRedirect: true,
      redirectTo,
    },
  });

  if (error || !data?.url) {
    console.error('Failed to initiate Supabase Google OAuth flow.', error ?? null);
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const authorizeUrl = new URL(data.url);
  const state = authorizeUrl.searchParams.get('state');
  const nonce = authorizeUrl.searchParams.get('nonce');

  if (!state) {
    console.error('Supabase OAuth response missing required state parameter.');
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  if (!nonce) {
    console.error('Supabase OAuth response missing required nonce parameter.');
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const codeVerifier = consumeCodeVerifier();

  if (!codeVerifier) {
    console.error('Failed to initiate Supabase Google OAuth flow. Missing PKCE verifier.');
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_STATE_COOKIE,
    value: encryptState({
      state,
      nonce,
      codeVerifier,
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
