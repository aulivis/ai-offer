import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import {
  Argon2Algorithm,
  argon2Hash,
  argon2Verify,
  type Argon2Options,
} from '@/lib/auth/argon2';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth/cookies';
import { CSRF_COOKIE_NAME, verifyCsrfToken } from '@/lib/auth/csrf';
import { decodeRefreshToken } from '../token';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const REFRESH_COOKIE = 'propono_rt';
// Industry best practice: 30 days for "remember me" sessions
const REMEMBER_ME_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days

const ARGON2_OPTIONS: Argon2Options = {
  algorithm: Argon2Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

type SessionRow = {
  id: string;
  user_id: string;
  rt_hash: string;
  issued_at: string;
  expires_at: string;
  rotated_from: string | null;
  revoked_at: string | null;
  ip: string | null;
  ua: string | null;
};

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id: string };
};

function getRequestIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}

async function refreshSupabaseTokens(refreshToken: string): Promise<RefreshResponse> {
  const endpoint = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  endpoint.searchParams.set('grant_type', 'refresh_token');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Supabase refresh failed with status ${response.status}`);
  }

  return (await response.json()) as RefreshResponse;
}

async function revokeAllSessions(
  userId: string,
  client: ReturnType<typeof supabaseServiceRole> = supabaseServiceRole(),
  log?: ReturnType<typeof createLogger>,
) {
  const now = new Date().toISOString();
  const { error } = await client.from('sessions').update({ revoked_at: now }).eq('user_id', userId);

  if (error) {
    log?.error('Failed to revoke user sessions', error);
  }
}

function isExpiredTimestamp(value: string) {
  return new Date(value).getTime() <= Date.now();
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const csrfHeader = request.headers.get('x-csrf-token');
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value ?? null;

  // CSRF validation: require CSRF token if a CSRF cookie exists
  // If no CSRF cookie exists but a refresh token is present, allow refresh
  // (this handles the case where CSRF cookie expired but refresh token is still valid)
  if (csrfCookie && !verifyCsrfToken(csrfHeader, csrfCookie)) {
    log.warn('Invalid CSRF token');
    return Response.json({ error: 'Érvénytelen vagy hiányzó CSRF token.' }, { status: 403 });
  }

  if (!refreshToken) {
    await clearAuthCookies();
    return Response.json({ error: 'Missing refresh token' }, { status: 401 });
  }

  const decoded = decodeRefreshToken(refreshToken);
  const userId = decoded?.sub;
  const refreshExpiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  if (!userId || !refreshExpiresAt) {
    log.warn('Invalid refresh token structure');
    await clearAuthCookies();
    return Response.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  log.setContext({ userId });

  if (refreshExpiresAt.getTime() <= Date.now()) {
    log.warn('Refresh token expired');
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token expired' }, { status: 401 });
  }

  const supabase = supabaseServiceRole();
  const { data, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, user_id, rt_hash, issued_at, expires_at, rotated_from, revoked_at, ip, ua')
    .eq('user_id', userId);

  if (sessionsError) {
    log.error('Failed to load sessions for user', sessionsError);
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  const sessionList = Array.isArray(data) ? (data as SessionRow[]) : [];

  if (sessionList.length === 0) {
    log.warn('No active sessions found');
    await clearAuthCookies();
    return Response.json({ error: 'No active sessions found' }, { status: 401 });
  }

  let activeSession: SessionRow | null = null;
  if (sessionList.length > 0) {
    for (const session of sessionList) {
      if (await argon2Verify(session.rt_hash, refreshToken)) {
        activeSession = session;
        break;
      }
    }
  }

  if (!activeSession) {
    await revokeAllSessions(userId, supabase, log);
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token reuse detected' }, { status: 401 });
  }

  if (activeSession.revoked_at) {
    await revokeAllSessions(userId, supabase, log);
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token already revoked' }, { status: 401 });
  }

  if (isExpiredTimestamp(activeSession.expires_at)) {
    await supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', activeSession.id);
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token expired' }, { status: 401 });
  }

  let refreshPayload: RefreshResponse;
  try {
    refreshPayload = await refreshSupabaseTokens(refreshToken);
  } catch (error) {
    log.error('Supabase refresh failed', error);
    await supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', activeSession.id);
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 401 });
  }

  const { access_token: accessToken, refresh_token: newRefreshToken } = refreshPayload;
  const expiresIn = (refreshPayload.expires_in ?? 0) | 0;

  if (!accessToken || !newRefreshToken) {
    log.error('Supabase refresh did not return tokens');
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  const newDecoded = decodeRefreshToken(newRefreshToken);
  const issuedAt = newDecoded?.iat ? new Date(newDecoded.iat * 1000) : null;
  const expiresAt = newDecoded?.exp ? new Date(newDecoded.exp * 1000) : null;

  if (!issuedAt || !expiresAt) {
    log.error('New refresh token missing iat or exp claims');
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  // Determine if this is a "remember me" session by checking if the session expiration
  // is significantly longer than a typical token expiration (e.g., > 7 days)
  const sessionDuration = activeSession.expires_at
    ? new Date(activeSession.expires_at).getTime() - new Date(activeSession.issued_at).getTime()
    : 0;
  const isRememberMeSession = sessionDuration > 7 * 24 * 60 * 60 * 1000; // > 7 days

  // Use the same expiration strategy: if remember me, extend to 30 days; otherwise use token expiration
  const newExpiresAt = isRememberMeSession
    ? new Date(issuedAt.getTime() + REMEMBER_ME_EXPIRES_IN_SECONDS * 1000)
    : expiresAt;

  const hashedRefresh = await argon2Hash(newRefreshToken, ARGON2_OPTIONS);

  const nowIso = new Date().toISOString();
  const [{ error: revokeError }, { error: insertError }] = await Promise.all([
    supabase.from('sessions').update({ revoked_at: nowIso }).eq('id', activeSession.id),
    supabase.from('sessions').insert({
      user_id: userId,
      rt_hash: hashedRefresh,
      issued_at: issuedAt.toISOString(),
      expires_at: newExpiresAt.toISOString(),
      rotated_from: activeSession.id,
      ip: getRequestIp(request),
      ua: request.headers.get('user-agent'),
    }),
  ]);

  if (revokeError || insertError) {
    log.error('Failed to update session rotation', { revokeError, insertError });
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  log.info('Session refreshed successfully');
  const accessTokenMaxAgeSeconds = expiresIn > 0 ? expiresIn : 3600;
  await setAuthCookies(accessToken, newRefreshToken, {
    accessTokenMaxAgeSeconds,
    rememberMe: isRememberMeSession,
  });

  return Response.json({ success: true });
}
