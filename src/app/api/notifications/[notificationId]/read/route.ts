import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';

const notificationIdParamsSchema = z.object({
  notificationId: uuidSchema,
});

type RouteParams = {
  params: Promise<{
    notificationId?: string;
  }>;
};

/**
 * PATCH /api/notifications/[notificationId]/read
 * Mark a specific notification as read
 */
export const PATCH = withAuth(async (request: AuthenticatedNextRequest, context: RouteParams) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  // Validate route parameters
  const resolvedParams = await context.params;
  const parsed = notificationIdParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return handleValidationError(parsed.error, requestId);
  }

  const notificationId = parsed.data.notificationId;
  log.setContext({ userId: request.user.id, notificationId });

  try {
    const sb = await supabaseServer();

    // Verify notification exists and belongs to user
    const { data: notification, error: notificationError } = await sb
      .from('offer_notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .maybeSingle();

    if (notificationError) {
      log.error('Failed to load notification', notificationError);
      return NextResponse.json({ error: 'Failed to load notification' }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.user_id !== request.user.id) {
      log.warn('Unauthorized notification update attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark as read
    const { error: updateError } = await sb
      .from('offer_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      log.error('Failed to mark notification as read', updateError);
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    log.info('Notification marked as read', { notificationId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Unexpected error during notification update', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
