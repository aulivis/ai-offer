import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';
import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from './redirectUtils';

function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateCodeVerifier(): string {
  return base64url(randomBytes(64));
}

function codeChallengeFromVerifier(verifier: string): string {
  const digest = createHash('sha256').update(verifier).digest();
  return base64url(digest);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const requested = url.searchParams.get('redirect_to');
  const finalRedirect = sanitizeOAuthRedirect(requested, '/dashboard');

  const callbackUrl = new URL('/api/auth/callback', envServer.APP_URL);
  callbackUrl.searchParams.set('redirect_to', finalRedirect);

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeFromVerifier(codeVerifier);

  const jar = await cookies();
  jar.set('sb_pkce_code_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: envServer.APP_URL.startsWith('https'),
    path: '/',
    maxAge: 5 * 60,
  });

  const authorizeUrl = new URL('/auth/v1/authorize', envServer.NEXT_PUBLIC_SUPABASE_URL);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', callbackUrl.toString());
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 's256');

  return NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
}
