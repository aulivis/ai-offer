import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseOAuthClient } from '../createSupabaseOAuthClient';
import { sanitizeOAuthRedirect } from '../redirectUtils';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { oauthRedirectSchema } from '@/lib/validation/schemas';

const googleLinkQuerySchema = z.object({
  redirect_to: oauthRedirectSchema,
});

function buildRedirect(target: string) {
  return NextResponse.redirect(target, { status: 302 });
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;
  const refreshToken = cookieStore.get('propono_rt')?.value ?? null;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'Aktív bejelentkezés szükséges a fiók összekapcsolásához.' },
      { status: 401 },
    );
  }

  // Validate query parameters
  const url = new URL(request.url);
  const queryParams = {
    redirect_to: url.searchParams.get('redirect_to') || undefined,
  };

  const parsed = googleLinkQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    // Invalid redirect URL - use default
    log.warn('Invalid redirect_to parameter in Google link request', {
      error: parsed.error,
      providedRedirect: queryParams.redirect_to,
    });
  }

  const successRedirect = sanitizeOAuthRedirect(
    parsed.success ? parsed.data.redirect_to : null,
    '/settings?link=google_success',
  );
  const errorRedirect = sanitizeOAuthRedirect(null, '/settings?link=google_error');

  const { client: supabase } = createSupabaseOAuthClient();

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    log.error('Failed to load Supabase session before linking Google identity', sessionError);
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
    log.error('Failed to initiate Supabase Google link flow', error ?? null);
    return buildRedirect(errorRedirect);
  }

  return buildRedirect(data.url);
}
