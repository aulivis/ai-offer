import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createSupabaseOAuthClient } from '../createSupabaseOAuthClient';
import { sanitizeOAuthRedirect } from '../redirectUtils';

function buildRedirect(target: string) {
  return NextResponse.redirect(target, { status: 302 });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;
  const refreshToken = cookieStore.get('propono_rt')?.value ?? null;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'Aktív bejelentkezés szükséges a fiók összekapcsolásához.' },
      { status: 401 },
    );
  }

  const successRedirect = sanitizeOAuthRedirect(
    new URL(request.url).searchParams.get('redirect_to'),
    '/settings?link=google_success',
  );
  const errorRedirect = sanitizeOAuthRedirect(null, '/settings?link=google_error');

  const { client: supabase } = createSupabaseOAuthClient();

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    console.error('Failed to load Supabase session before linking Google identity.', sessionError);
    return buildRedirect(errorRedirect);
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: successRedirect,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    console.error('Failed to initiate Supabase Google link flow.', error ?? null);
    return buildRedirect(errorRedirect);
  }

  return buildRedirect(data.url);
}
