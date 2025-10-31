import { createHmac, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { envServer } from '@/env.server';

import { createSupabaseOAuthClient } from './createSupabaseOAuthClient';
import { getGoogleProviderStatus } from './providerStatus';
import { sanitizeOAuthRedirect } from './redirectUtils';

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createStateSignature(state: string): string {
  return createHmac('sha256', envServer.AUTH_COOKIE_SECRET).update(state).digest('hex');
}

export async function GET(request: Request) {
  const providerStatus = await getGoogleProviderStatus();
  if (!providerStatus.enabled) {
    const message =
      providerStatus.message ??
      'A Google bejelentkezés jelenleg nem elérhető. Kérjük, próbáld újra később.';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('redirect_to');
  const finalRedirect = sanitizeOAuthRedirect(requested, '/dashboard');

  const { client: supabase, consumeCodeVerifier } = createSupabaseOAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: finalRedirect,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    console.error('Failed to initiate Google authentication.', error ?? null);
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const codeVerifier = await consumeCodeVerifier();
  if (!codeVerifier) {
    console.error('Supabase did not provide a PKCE code verifier for Google auth.');
    return NextResponse.json({ error: 'Unable to start Google authentication.' }, { status: 500 });
  }

  const authUrl = new URL(data.url);
  let state = authUrl.searchParams.get('state');

  if (!authUrl.searchParams.get('nonce')) {
    authUrl.searchParams.set('nonce', base64url(randomBytes(32)));
  }

  if (!state) {
    state = base64url(randomBytes(32));
    authUrl.searchParams.set('state', state);
  }

  const jar = await cookies();
  const isSecure = envServer.APP_URL.startsWith('https');

  if (state) {
    jar.set({
      name: 'auth_state',
      value: `${state}:${createStateSignature(state)}`,
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 5 * 60,
    });
  }

  jar.set({
    name: 'sb_pkce_code_verifier',
    value: codeVerifier,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 5 * 60,
  });

  return NextResponse.redirect(authUrl.toString(), { status: 302 });
}
