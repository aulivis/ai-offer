import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditLogEvent = {
  eventType: 'offer_deleted' | 'payment_initiated' | 'auth_logout' | 'auth_session_revoked';
  userId: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent(supabase: SupabaseClient, event: AuditLogEvent): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      id: randomUUID(),
      event_type: event.eventType,
      user_id: event.userId,
      metadata: event.metadata ?? {},
      request_id: event.requestId ?? randomUUID(),
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to write audit log', { error, event });
    }
  } catch (error) {
    console.error('Exception while writing audit log', { error, event });
  }
}

export function getRequestIp(request: Request | Headers): string | null {
  const headers = request instanceof Request ? request.headers : request;
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}
