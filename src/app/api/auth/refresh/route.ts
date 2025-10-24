import argon2 from 'argon2';
import { cookies } from 'next/headers';

import { envServer } from '@/env.server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies, setAuthCookies } from '../../../../../lib/auth/cookies';
import { decodeRefreshToken, type DecodedRefreshToken } from '../token';

const REFRESH_COOKIE = 'propono_rt';

const ARGON2_OPTIONS: argon2.Options & { type: argon2.Type } = {
  type: argon2.argon2id,
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
  client: ReturnType<typeof supabaseServer> = supabaseServer(),
) {
  const now = new Date().toISOString();
  const { error } = await client
    .from('sessions')
    .update({ revoked_at: now })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to revoke user sessions.', error);
  }
}

function isExpiredTimestamp(value: string) {
  return new Date(value).getTime() <= Date.now();
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value ?? null;

  if (!refreshToken) {
    await clearAuthCookies();
    return Response.json({ error: 'Missing refresh token' }, { status: 401 });
  }

  const decoded = decodeRefreshToken(refreshToken);
  const userId = decoded?.sub;
  const refreshExpiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

  if (!userId || !refreshExpiresAt) {
    await clearAuthCookies();
    return Response.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  if (refreshExpiresAt.getTime() <= Date.now()) {
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token expired' }, { status: 401 });
  }

  const supabase = supabaseServer();
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select<SessionRow>('id, user_id, rt_hash, issued_at, expires_at, rotated_from, revoked_at, ip, ua')
    .eq('user_id', userId);

  if (sessionsError) {
    console.error('Failed to load sessions for user.', sessionsError);
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  let activeSession: SessionRow | null = null;
  if (sessions) {
    for (const session of sessions) {
      if (await argon2.verify(session.rt_hash, refreshToken)) {
        activeSession = session;
        break;
      }
    }
  }

  if (!activeSession) {
    await revokeAllSessions(userId, supabase);
    await clearAuthCookies();
    return Response.json({ error: 'Refresh token reuse detected' }, { status: 401 });
  }

  if (activeSession.revoked_at) {
    await revokeAllSessions(userId, supabase);
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
    console.error('Supabase refresh failed.', error);
    await supabase
      .from('sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', activeSession.id);
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 401 });
  }

  const { access_token: accessToken, refresh_token: newRefreshToken } = refreshPayload;

  if (!accessToken || !newRefreshToken) {
    console.error('Supabase refresh did not return tokens.');
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  const newDecoded = decodeRefreshToken(newRefreshToken);
  const issuedAt = newDecoded?.iat ? new Date(newDecoded.iat * 1000) : null;
  const expiresAt = newDecoded?.exp ? new Date(newDecoded.exp * 1000) : null;

  if (!issuedAt || !expiresAt) {
    console.error('New refresh token missing iat or exp claims.');
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  const hashedRefresh = await argon2.hash(newRefreshToken, ARGON2_OPTIONS);

  const nowIso = new Date().toISOString();
  const [{ error: revokeError }, { error: insertError }] = await Promise.all([
    supabase
      .from('sessions')
      .update({ revoked_at: nowIso })
      .eq('id', activeSession.id),
    supabase.from('sessions').insert({
      user_id: userId,
      rt_hash: hashedRefresh,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      rotated_from: activeSession.id,
      ip: getRequestIp(request),
      ua: request.headers.get('user-agent'),
    }),
  ]);

  if (revokeError || insertError) {
    console.error('Failed to update session rotation.', { revokeError, insertError });
    await clearAuthCookies();
    return Response.json({ error: 'Unable to refresh session' }, { status: 500 });
  }

  await setAuthCookies(accessToken, newRefreshToken);

  return Response.json({ success: true });
}
