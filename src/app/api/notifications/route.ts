import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { z } from 'zod';
import {
  createErrorResponse,
  HttpStatus,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { withTimeout, API_TIMEOUTS } from '@/lib/timeout';

const notificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 50;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) || parsed < 1 ? 50 : Math.min(parsed, 100);
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 0;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }),
});

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Optimized to use a single query with conditional counting for unread notifications
 */
export const GET = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    // Parse query parameters
    const url = new URL(request.url);
    // Convert null to undefined for optional parameters (searchParams.get returns null when missing)
    const queryParsed = notificationsQuerySchema.safeParse({
      unreadOnly: url.searchParams.get('unreadOnly') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    if (!queryParsed.success) {
      // Log validation errors for debugging
      const requestId = request.headers.get('x-request-id') || 'unknown';
      const log = createLogger(requestId);
      log.warn('Notifications query validation failed', {
        errors: queryParsed.error.issues,
        queryParams: {
          unreadOnly: url.searchParams.get('unreadOnly'),
          limit: url.searchParams.get('limit'),
          offset: url.searchParams.get('offset'),
        },
        userId: request.user.id,
      });
      throw queryParsed.error; // Will be handled by withAuthenticatedErrorHandling
    }

    const { unreadOnly, limit, offset } = queryParsed.data;

    // Wrap database operations in timeout to prevent hanging requests
    return withTimeout(
      async (_signal) => {
        const sb = await supabaseServer();

        // Optimized: Build main query with count
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
          throw notificationsError; // Will be handled by withAuthenticatedErrorHandling
        }

        // Optimized: Only fetch unread count if not already filtered by unreadOnly
        // If unreadOnly is true, we can calculate unreadCount from the results
        let unreadCount: number;
        if (unreadOnly) {
          // If filtering by unread only, the count is the unread count
          unreadCount = count || 0;
        } else {
          // Otherwise, get unread count in parallel with a separate optimized query
          const { count: unreadCountResult } = await sb
            .from('offer_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', request.user.id)
            .eq('is_read', false);
          unreadCount = unreadCountResult || 0;
        }

        return NextResponse.json({
          notifications: notifications || [],
          unreadCount,
          total: count || 0,
        });
      },
      API_TIMEOUTS.DATABASE,
      'Notifications query timed out',
    );
  }),
);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
export const POST = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
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
        throw updateError; // Will be handled by withAuthenticatedErrorHandling
      }

      return NextResponse.json({ success: true });
    }

    return createErrorResponse('Invalid endpoint', HttpStatus.NOT_FOUND);
  }),
);
