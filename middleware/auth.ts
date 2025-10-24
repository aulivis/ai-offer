import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { envClient } from '@/env.client';
import { CSRF_COOKIE_NAME, verifyCsrfToken } from '../lib/auth/csrf';

const supabase = createClient(
  envClient.NEXT_PUBLIC_SUPABASE_URL,
  envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export type AuthenticatedNextRequest = NextRequest & { user: AuthenticatedUser };

type Handler<Args extends unknown[], Result> = (
  req: AuthenticatedNextRequest,
  ...args: Args
) => Result | Promise<Result>;

async function authenticateRequest(
  req: NextRequest,
): Promise<AuthenticatedUser | NextResponse> {
  const token = req.cookies.get('propono_at')?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'A bejelentkezés lejárt vagy érvénytelen.' },
      { status: 401 },
    );
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    if (!verifyCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { error: 'Érvénytelen vagy hiányzó CSRF token.' },
        { status: 403 },
      );
    }
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return NextResponse.json(
        { error: 'A bejelentkezés lejárt vagy érvénytelen.' },
        { status: 401 },
      );
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  } catch (error) {
    console.error('Failed to verify Supabase access token', error);
    return NextResponse.json(
      { error: 'A bejelentkezés lejárt vagy érvénytelen.' },
      { status: 401 },
    );
  }
}

export function withAuth<Args extends unknown[], Result>(
  handler: Handler<Args, Result>,
) {
  return async (
    req: NextRequest,
    ...args: Args
  ): Promise<Result> => {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult as unknown as Result;
    }

    const authenticatedReq = req as AuthenticatedNextRequest;
    authenticatedReq.user = authResult;

    return handler(authenticatedReq, ...args);
  };
}
