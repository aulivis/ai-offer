import { cookies } from 'next/headers';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '../../../../../lib/auth/cookies';
import { verifyCsrfToken } from '../../../../../lib/auth/csrf';
import { decodeRefreshToken } from '../token';
import { argon2Verify } from '../../../../../lib/auth/argon2';

type SessionRow = {
  id: string;
  user_id: string;
  rt_hash: string;
  revoked_at: string | null;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const csrfHeader = request.headers.get('x-csrf-token');
  const csrfCookie = cookieStore.get('XSRF-TOKEN')?.value;

  if (!verifyCsrfToken(csrfHeader, csrfCookie)) {
    return Response.json({ error: 'Érvénytelen vagy hiányzó CSRF token.' }, { status: 403 });
  }

  const refreshToken = cookieStore.get('propono_rt')?.value ?? null;

  if (!refreshToken) {
    await clearAuthCookies();
    return Response.json({ success: true });
  }

  const decoded = decodeRefreshToken(refreshToken);
  const userId = decoded?.sub;

  if (!userId) {
    await clearAuthCookies();
    return Response.json({ success: true });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, rt_hash, revoked_at')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to load sessions for logout.', error);
    await clearAuthCookies();
    return Response.json({ success: true });
  }

  const sessionList = Array.isArray(data) ? (data as SessionRow[]) : [];

  if (sessionList.length > 0) {
    const nowIso = new Date().toISOString();
    for (const session of sessionList) {
      try {
        const matches = await argon2Verify(session.rt_hash, refreshToken);
        if (matches) {
          const { error: revokeError } = await supabase
            .from('sessions')
            .update({ revoked_at: nowIso })
            .eq('id', session.id);
          if (revokeError) {
            console.error('Failed to revoke session during logout.', revokeError);
          }
          break;
        }
      } catch (err) {
        console.error('Failed to verify session hash during logout.', err);
      }
    }
  }

  await clearAuthCookies();
  return Response.json({ success: true });
}
