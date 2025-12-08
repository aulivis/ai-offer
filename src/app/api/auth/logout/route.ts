import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { verifyCsrfToken } from '@/lib/auth/csrf';
import { decodeRefreshToken } from '../token';
import { argon2Verify } from '@/lib/auth/argon2';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { withErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';

type SessionRow = {
  id: string;
  user_id: string;
  rt_hash: string;
  revoked_at: string | null;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = await cookies();
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const csrfHeader = request.headers.get('x-csrf-token');
  const csrfCookie = cookieStore.get('XSRF-TOKEN')?.value;

  if (!verifyCsrfToken(csrfHeader, csrfCookie)) {
    log.warn('Invalid CSRF token');
    return createErrorResponse('Érvénytelen vagy hiányzó CSRF token.', HttpStatus.FORBIDDEN);
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

  log.setContext({ userId });
  const supabase = supabaseServiceRole();

  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, rt_hash, revoked_at')
    .eq('user_id', userId);

  if (error) {
    log.error('Failed to load sessions for logout', error);
    await clearAuthCookies();
    return Response.json({ success: true });
  }

  const sessionList = Array.isArray(data) ? (data as SessionRow[]) : [];

  if (sessionList.length > 0) {
    const nowIso = new Date().toISOString();
    let revokedSessionId: string | null = null;
    for (const session of sessionList) {
      try {
        const matches = await argon2Verify(session.rt_hash, refreshToken);
        if (matches) {
          revokedSessionId = session.id;
          const { error: revokeError } = await supabase
            .from('sessions')
            .update({ revoked_at: nowIso })
            .eq('id', session.id);
          if (revokeError) {
            log.error('Failed to revoke session during logout', revokeError);
          }
          break;
        }
      } catch (err) {
        log.error('Failed to verify session hash during logout', err);
      }
    }

    // Audit log the logout
    if (revokedSessionId) {
      await logAuditEvent(supabase, {
        eventType: 'auth_logout',
        userId,
        metadata: { sessionId: revokedSessionId },
        requestId,
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get('user-agent'),
      });
      log.info('User logged out successfully');
    }
  }

  await clearAuthCookies();
  return Response.json({ success: true });
});
