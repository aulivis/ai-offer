import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/env.server';
import { withErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { clearAuthCookies } from '@/lib/auth/cookies';

/**
 * API endpoint to initialize Supabase client session from HttpOnly cookies.
 * This is needed because HttpOnly cookies cannot be read by client-side JavaScript.
 *
 * POST /api/auth/init-session
 *
 * Body: { expectedUserId?: string }
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();

  const body = await request.json().catch(() => ({}));
  const expectedUserId = typeof body.expectedUserId === 'string' ? body.expectedUserId : undefined;

  // Read HttpOnly cookies (server-side can access them)
  const accessToken = cookieStore.get('propono_at')?.value ?? null;
  const refreshToken = cookieStore.get('propono_rt')?.value ?? null;

  // Debug: log all cookies to help diagnose the issue
  const allCookies = cookieStore.getAll();
  log.info('Session initialization request', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expectedUserId,
    cookieNames: allCookies.map((c) => c.name),
    cookieCount: allCookies.length,
  });

  if (!accessToken || !refreshToken) {
    log.warn('Session initialization requested but cookies not found', {
      allCookies: allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
      requestHeaders: {
        cookie: request.headers.get('cookie'),
        referer: request.headers.get('referer'),
      },
    });
    return NextResponse.json(
      {
        success: false,
        error: 'No authentication cookies found',
        hasCookies: false,
        debug: {
          cookieNames: allCookies.map((c) => c.name),
        },
      },
      { status: 401 },
    );
  }

  // Create a Supabase client to verify the tokens and get user info
  const supabase = createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );

  // Verify the access token and get user info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    log.warn('Failed to verify access token', { error: userError?.message });
    // Clear invalid cookies
    await clearAuthCookies();
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid access token',
        hasCookies: false,
      },
      { status: 401 },
    );
  }

  // Verify user ID matches if expected
  if (expectedUserId && user.id !== expectedUserId) {
    log.warn('User ID mismatch', {
      expected: expectedUserId,
      actual: user.id,
    });
    // Clear cookies on user ID mismatch
    await clearAuthCookies();
    return createErrorResponse('User ID mismatch', HttpStatus.FORBIDDEN);
  }

  log.info('Session initialization verified', {
    userId: user.id,
    matchesExpected: expectedUserId ? user.id === expectedUserId : true,
  });

  // Return tokens to client so it can initialize Supabase session
  // Note: This is safe because:
  // 1. Only accessible to same-origin requests (CORS)
  // 2. Only works if HttpOnly cookies are present (server-side validation)
  // 3. Tokens are only returned after verifying they're valid
  // 4. Used immediately to set session, not stored
  return NextResponse.json({
    success: true,
    userId: user.id,
    hasCookies: true,
    // Return tokens so client can initialize Supabase session
    // These are already validated and will be used immediately
    accessToken,
    refreshToken,
    message: 'Cookies verified, tokens provided for session initialization',
  });
});
