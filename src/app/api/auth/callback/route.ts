import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { envServer } from '@/env.server';
import { sanitizeOAuthRedirect } from '../google/redirectUtils';
import { setCSRFCookie } from '../../../../../lib/auth/cookies';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const finalRedirect = sanitizeOAuthRedirect(url.searchParams.get('redirect_to'), '/dashboard');

  // --- Magic link flow (Supabase küldi vissza az access_token/refresh_token paramétereket) ---
  const accessTokenFromLink =
    url.searchParams.get('access_token') ?? url.searchParams.get('token') ?? null;
  const refreshTokenFromLink = url.searchParams.get('refresh_token');
  const expiresInFromLink = url.searchParams.get('expires_in');

  if (accessTokenFromLink) {
    const jar = await cookies();
    const isSecure = envServer.APP_URL.startsWith('https');
    const maxAge = (expiresInFromLink ? Number.parseInt(expiresInFromLink, 10) : NaN) || 3600;

    jar.set('propono_at', accessTokenFromLink, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge,
    });

    if (refreshTokenFromLink) {
      jar.set('propono_rt', refreshTokenFromLink, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
      });
    }

    await setCSRFCookie();
    return NextResponse.redirect(new URL(finalRedirect, envServer.APP_URL));
  }

  // --- OAuth PKCE flow (Google) ---
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?message=Missing%20auth%20code', envServer.APP_URL),
    );
  }

  try {
    const jar = await cookies();
    const verifierCookie = jar.get('sb_pkce_code_verifier')?.value ?? null;

    if (!verifierCookie) {
      return NextResponse.redirect(
        new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL),
      );
    }

    const tokenUrl = `${envServer.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: verifierCookie,
        redirect_uri: envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI,
      }),
    });

    // PKCE verifier törlése
    jar.set('sb_pkce_code_verifier', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: envServer.APP_URL.startsWith('https'),
      path: '/',
      maxAge: 0,
    });

    if (!res.ok) {
      return NextResponse.redirect(
        new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL),
      );
    }

    const json = await res.json();
    const accessToken = json?.access_token as string | undefined;
    const refreshToken = json?.refresh_token as string | undefined;
    const expiresIn = (json?.expires_in as number | undefined) ?? 3600;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL),
      );
    }

    const isSecure = envServer.APP_URL.startsWith('https');

    jar.set('propono_at', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: expiresIn,
    });

    if (refreshToken) {
      jar.set('propono_rt', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
      });
    }

    await setCSRFCookie();
    return NextResponse.redirect(new URL(finalRedirect, envServer.APP_URL));
  } catch {
    return NextResponse.redirect(
      new URL('/login?message=Unable%20to%20authenticate', envServer.APP_URL),
    );
  }
}
