import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
export const POST = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    const sb = await supabaseServer();

    const { error: updateError } = await sb
      .from('offer_notifications')
      .update({ is_read: true })
      .eq('user_id', request.user.id)
      .eq('is_read', false);

    if (updateError) {
      log.error('Failed to mark all notifications as read', updateError);
      throw updateError;
    }

    log.info('All notifications marked as read');

    return NextResponse.json({ success: true });
  }),
);
