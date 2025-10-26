import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from './redirectUtils';

// PKCE utils
function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
function generateCodeVerifier(): string {
  // 32..96 byte ajánlott; itt 64 byte
  return base64url(randomBytes(64));
}
function codeChallengeFromVerifier(verifier: string): string {
  const digest = createHash('sha256').update(verifier).digest();
  return base64url(digest);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Végső cél (pl. /dashboard) — allowlistelve
  const requested = url.searchParams.get('redirect_to');
  const finalRedirect = sanitizeOAuthRedirect(requested, '/dashboard');

  // Callback URL a SAJÁT appon (ide tér vissza a Supabase a kóddal)
  const callbackUrl = new URL('/api/auth/callback', envServer.APP_URL);
  callbackUrl.searchParams.set('redirect_to', finalRedirect);

  // PKCE: code_verifier + code_challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);

  // tedd sütibe a verifiert, hogy a callbackben ki tudd olvasni
  const jar = await cookies();
  jar.set('sb_pkce_code_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: envServer.APP_URL.startsWith('https'), // localhostnál false, prodnál true
    path: '/',
    maxAge: 5 * 60,
  });

  // Hosted Supabase authorize URL (KÖZVETLENÜL a Supabase-hez megyünk)
  // NEXT_PUBLIC_SUPABASE_URL pl.: https://<project-ref>.supabase.co
  const authorize = new URL('/auth/v1/authorize', envServer.NEXT_PUBLIC_SUPABASE_URL);
  authorize.searchParams.set('provider', 'google');
  authorize.searchParams.set('redirect_to', callbackUrl.toString());
  authorize.searchParams.set('code_challenge', codeChallenge);
  authorize.searchParams.set('code_challenge_method', 's256');

  return NextResponse.redirect(authorize.toString(), { status: 302 });
}
