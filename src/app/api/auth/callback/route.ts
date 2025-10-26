import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const finalRedirect = sanitizeOAuthRedirect(url.searchParams.get('redirect_to'), '/dashboard');

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=Missing%20auth%20code', envServer.APP_URL));
  }

  try {
    const jar = await cookies();
    const verifierCookie = jar.get('sb_pkce_code_verifier')?.value ?? null;

    if (!verifierCookie) {
      return NextResponse.redirect(new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL));
    }

    const tokenUrl = `${envServer.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token`;

    const form = new URLSearchParams();
    form.set('grant_type', 'authorization_code');
    form.set('code', code);
    form.set('code_verifier', verifierCookie);
    form.set('redirect_uri', envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: form.toString(),
    });

    jar.set('sb_pkce_code_verifier', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL));
    }

    const json = await res.json();
    const accessToken = json?.access_token as string | undefined;
    const refreshToken = json?.refresh_token as string | undefined;
    const expiresIn = (json?.expires_in as number | undefined) ?? 3600;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL));
    }

    const isSecure = envServer.APP_URL.startsWith('https');
    const c = await cookies();

    c.set('propono_at', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: expiresIn,
    });

    if (refreshToken) {
      c.set('propono_rt', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
      });
    }

    return NextResponse.redirect(new URL(finalRedirect, envServer.APP_URL));
  } catch {
    return NextResponse.redirect(new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL));
  }
}
