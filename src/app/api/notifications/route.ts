import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '../../../../middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { handleValidationError } from '@/lib/errorHandling';

const notificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0)),
});

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export const GET = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const queryParsed = notificationsQuerySchema.safeParse({
      unreadOnly: url.searchParams.get('unreadOnly'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });

    if (!queryParsed.success) {
      return handleValidationError(queryParsed.error, requestId);
    }

    const { unreadOnly, limit, offset } = queryParsed.data;

    const sb = await supabaseServer();

    // Build query
    let query = sb
      .from('offer_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: notificationsError, count } = await query;

    if (notificationsError) {
      log.error('Failed to load notifications', notificationsError);
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
    }

    // Get unread count separately
    const { count: unreadCount } = await sb
      .from('offer_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', request.user.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      total: count || 0,
    });
  } catch (error) {
    log.error('Unexpected error during notifications fetch', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
export const POST = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this is the read-all endpoint
    if (pathname.endsWith('/read-all')) {
      const sb = await supabaseServer();

      const { error: updateError } = await sb
        .from('offer_notifications')
        .update({ is_read: true })
        .eq('user_id', request.user.id)
        .eq('is_read', false);

      if (updateError) {
        log.error('Failed to mark all notifications as read', updateError);
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 500 },
        );
      }

      log.info('All notifications marked as read');

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    log.error('Unexpected error during mark all as read', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
