import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { envServer } from '@/env.server';
import { getGoogleProviderStatus } from './providerStatus';
import { sanitizeOAuthRedirect } from './redirectUtils';

/** URL-safe base64 (RFC 4648, padding nélkül) */
function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** SHA-256(base64url) a PKCE code_challenge-hez (S256) */
function sha256base64url(input: string) {
  const hash = createHash('sha256').update(input).digest();
  return base64url(hash);
}

export async function GET(request: Request) {
  // 0) Provider státusz
  const providerStatus = await getGoogleProviderStatus();
  if (!providerStatus.enabled) {
    const message =
      providerStatus.message ??
      'A Google bejelentkezés jelenleg nem elérhető. Kérjük, próbáld újra később.';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // 1) redirect_to szanitizálása
  const url = new URL(request.url);
  const requested = url.searchParams.get('redirect_to');
  const finalRedirect = sanitizeOAuthRedirect(requested, '/dashboard');

  // 2) Callback URL (ezt adja vissza a Google a Supabase-en keresztül)
  const callbackUrl = new URL(envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI);
  callbackUrl.searchParams.set('redirect_to', finalRedirect);

  // 3) PKCE: mi generáljuk a verifiert és a challenge-et
  const codeVerifier = base64url(randomBytes(64));       // 43..128 char, URL-safe
  const codeChallenge = sha256base64url(codeVerifier);   // S256

  // 4) Verifier sütiben (HttpOnly), 5 perc élettartam
  const jar = await cookies();
  const isSecure = envServer.APP_URL.startsWith('https');

  jar.set({
    name: 'sb_pkce_code_verifier',
    value: codeVerifier,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 5 * 60,
  });

  // 5) Supabase authorize URL — NINCS state (különben bad_oauth_state lehet)
  const authorizeUrl = new URL('/auth/v1/authorize', envServer.NEXT_PUBLIC_SUPABASE_URL);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', callbackUrl.toString());
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 's256'); // Supabase 's256'-et vár (lowercase)

  // opcionális: további scope-ok
  // authorizeUrl.searchParams.set('scopes', 'openid email profile');

  return NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
}
