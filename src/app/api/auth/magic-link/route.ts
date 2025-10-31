import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { envServer } from '@/env.server';
import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { createAuthRequestLogger } from '@/lib/observability/authLogging';

export async function POST(request: Request) {
  const logger = createAuthRequestLogger();
  const body = await request.json().catch(() => ({}));
  const email = (body?.email ?? '').toString().trim().toLowerCase();
  const requestedRedirect = (body?.redirect_to ?? '').toString();

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // 1) Végső cél szanitizálása és eltárolása HttpOnly sütiben
  const finalRedirect = sanitizeOAuthRedirect(requestedRedirect, '/dashboard');
  const jar = await cookies();
  const isSecure = envServer.APP_URL.startsWith('https');

  jar.set({
    name: 'post_auth_redirect',
    value: finalRedirect,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
    maxAge: 5 * 60, // 5 perc
  });

  // 2) A magic link a PUBLikus callbackre mutasson, query NÉLKÜL
  const publicCallback = new URL('/auth/callback', envServer.APP_URL);

  const supabase = supabaseAnonServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: publicCallback.toString(), // nincs redirect_to query!
      shouldCreateUser: true,
    },
  });

  if (error) {
    logger.error('Magic link dispatch failed.', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
