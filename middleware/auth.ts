import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { envClient } from '@/env.client';
import { envServer } from '@/env.server';
import { CSRF_COOKIE_NAME, verifyCsrfToken } from '../lib/auth/csrf';
import { resolveRequestLanguage } from '@/app/lib/language';
import { withLanguage } from '@/state/lang.server';

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

const allowedOrigins = (() => {
  try {
    const appUrl = new URL(envServer.APP_URL);
    const appOrigin = appUrl.origin;
    const origins = new Set([appOrigin]);
    
    // Also allow the opposite protocol (HTTP <-> HTTPS) for the same domain
    // This handles cases where APP_URL is HTTP but requests come via HTTPS (or vice versa)
    if (appUrl.protocol === 'http:') {
      const httpsOrigin = `https://${appUrl.host}`;
      origins.add(httpsOrigin);
    } else if (appUrl.protocol === 'https:') {
      const httpOrigin = `http://${appUrl.host}`;
      origins.add(httpOrigin);
    }
    
    return origins;
  } catch (error) {
    console.error('Failed to parse APP_URL for origin checks.', error);
    return new Set<string>();
  }
})();

const allowedFetchSites = new Set(['same-origin', 'same-site', 'none']);
const allowedFetchModes = new Set(['cors', 'same-origin', 'navigate']);
const allowedFetchDests = new Set(['empty', 'document', 'iframe', 'nested-document']);

function extractOrigin(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.has(origin);
}

function validateRequestContext(req: NextRequest): NextResponse | null {
  const originHeader = req.headers.get('origin');
  const refererHeader = req.headers.get('referer');

  const originToCheck = originHeader ?? extractOrigin(refererHeader);

  if (!isAllowedOrigin(originToCheck)) {
    console.warn('Request origin validation failed', {
      method: req.method,
      url: req.url,
      origin: originToCheck,
      allowedOrigins: Array.from(allowedOrigins),
      originHeader,
      refererHeader,
    });
    return NextResponse.json({ error: 'A kérés forrása nincs engedélyezve.' }, { status: 403 });
  }

  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && !allowedFetchSites.has(fetchSite)) {
    console.warn('Request sec-fetch-site validation failed', {
      method: req.method,
      url: req.url,
      secFetchSite: fetchSite,
      allowedSites: Array.from(allowedFetchSites),
    });
    return NextResponse.json({ error: 'A kérés forrása nincs engedélyezve.' }, { status: 403 });
  }

  const fetchMode = req.headers.get('sec-fetch-mode');
  if (fetchMode && !allowedFetchModes.has(fetchMode)) {
    console.warn('Request sec-fetch-mode validation failed', {
      method: req.method,
      url: req.url,
      secFetchMode: fetchMode,
      allowedModes: Array.from(allowedFetchModes),
    });
    return NextResponse.json({ error: 'A kérés forrása nincs engedélyezve.' }, { status: 403 });
  }

  const fetchDest = req.headers.get('sec-fetch-dest');
  if (fetchDest && !allowedFetchDests.has(fetchDest)) {
    console.warn('Request sec-fetch-dest validation failed', {
      method: req.method,
      url: req.url,
      secFetchDest: fetchDest,
      allowedDests: Array.from(allowedFetchDests),
    });
    return NextResponse.json({ error: 'A kérés forrása nincs engedélyezve.' }, { status: 403 });
  }

  return null;
}

async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const token = req.cookies.get('propono_at')?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'A bejelentkezés lejárt vagy érvénytelen.' },
      { status: 401 },
    );
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contextValidation = validateRequestContext(req);
    if (contextValidation) {
      return contextValidation;
    }

    const csrfHeader = req.headers.get('x-csrf-token');
    const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    if (!verifyCsrfToken(csrfHeader, csrfCookie)) {
      console.warn('CSRF token validation failed', {
        method: req.method,
        url: req.url,
        hasCsrfHeader: !!csrfHeader,
        hasCsrfCookie: !!csrfCookie,
        csrfHeaderLength: csrfHeader?.length ?? 0,
        csrfCookieLength: csrfCookie?.length ?? 0,
      });
      return NextResponse.json({ error: 'Érvénytelen vagy hiányzó CSRF token.' }, { status: 403 });
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

export function withAuth<Args extends unknown[], Result>(handler: Handler<Args, Result>) {
  return async (req: NextRequest, ...args: Args): Promise<Result> => {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult as unknown as Result;
    }

    const authenticatedReq = req as AuthenticatedNextRequest;
    authenticatedReq.user = authResult;

    const language = resolveRequestLanguage(req);

    // Ensure handler is actually a function before calling
    if (typeof handler !== 'function') {
      console.error('withAuth: handler is not a function', { handler, type: typeof handler });
      return NextResponse.json(
        { error: 'Belső szerver hiba: érvénytelen kéréskezelő.' },
        { status: 500 },
      ) as unknown as Result;
    }

    return withLanguage(language, () => handler(authenticatedReq, ...args));
  };
}
