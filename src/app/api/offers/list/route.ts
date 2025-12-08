/**
 * GET /api/offers/list
 *
 * Cursor-based pagination endpoint for offers list.
 * Provides efficient pagination for large datasets.
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { handleValidationError } from '@/lib/errorHandling';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { z } from 'zod';
import {
  decodeCursor,
  encodeCursor,
  extractCursor,
  type CursorPaginationResult,
} from '@/lib/pagination/cursor';

const PAGE_SIZE = 12;

const listOffersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(PAGE_SIZE),
  filter: z.enum(['all', 'my', 'team', 'member']).default('all'),
  teamIds: z.string().optional(),
  memberIds: z.string().optional(),
});

export const GET = withAuth(
  withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id });

    const { searchParams } = new URL(req.url);
    const parsed = listOffersQuerySchema.safeParse({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || PAGE_SIZE,
      filter: searchParams.get('filter') || 'all',
      teamIds: searchParams.get('teamIds') || undefined,
      memberIds: searchParams.get('memberIds') || undefined,
    });

    if (!parsed.success) {
      return handleValidationError(parsed.error, requestId);
    }

    const { cursor: cursorString, limit, filter, teamIds, memberIds } = parsed.data;
    const cursor = cursorString ? decodeCursor(cursorString) : null;

    const sb = await supabaseServer();

    // Build base query
    let query = sb
      .from('offers')
      .select(
        'id,title,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id,user_id,created_by,updated_by,team_id,recipient:recipient_id ( company_name ),created_by_user:created_by ( id, email ),updated_by_user:updated_by ( id, email )',
        { count: 'exact' },
      );

    // Apply filters
    if (filter === 'my') {
      query = query.eq('user_id', req.user.id);
    } else if (filter === 'team') {
      const teamIdsArray = teamIds ? teamIds.split(',').filter(Boolean) : [];
      if (teamIdsArray.length === 0) {
        return NextResponse.json({ items: [], hasNext: false, nextCursor: null });
      }
      query = query.not('team_id', 'is', null).in('team_id', teamIdsArray);
    } else if (filter === 'all') {
      const teamIdsArray = teamIds ? teamIds.split(',').filter(Boolean) : [];
      if (teamIdsArray.length > 0) {
        query = query.or(`user_id.eq.${req.user.id},team_id.in.(${teamIdsArray.join(',')})`);
      } else {
        query = query.eq('user_id', req.user.id);
      }
    } else if (filter === 'member') {
      const memberIdsArray = memberIds ? memberIds.split(',').filter(Boolean) : [];
      if (memberIdsArray.length > 0) {
        query = query.in('created_by', memberIdsArray);
      } else {
        query = query.eq('user_id', req.user.id);
      }
    } else {
      query = query.eq('user_id', req.user.id);
    }

    // Apply cursor filter for pagination
    // For descending order (newest first), we need items where:
    // created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)
    if (cursor) {
      // Use OR filter: items where created_at is less than cursor OR
      // (created_at equals cursor AND id is less than cursor id)
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      );
    }

    // Order by created_at DESC first, then id DESC as tiebreaker
    // This ensures consistent ordering for cursor-based pagination
    query = query.order('created_at', { ascending: false }).order('id', { ascending: false });

    // Fetch one extra item to determine if there's a next page
    const { data, error, count } = await query.limit(limit + 1);

    if (error) {
      log.error('Failed to fetch offers with cursor pagination', error);
      throw error;
    }

    const items = Array.isArray(data) ? data : [];
    const hasNext = items.length > limit;
    const pageItems = hasNext ? items.slice(0, limit) : items;

    // Transform items to match Offer type
    const transformedItems = pageItems.map((entry) => {
      const recipientValue = Array.isArray(entry.recipient)
        ? (entry.recipient[0] ?? null)
        : (entry.recipient ?? null);

      const createdByUserValue = Array.isArray(entry.created_by_user)
        ? (entry.created_by_user[0] ?? null)
        : (entry.created_by_user ?? null);

      const updatedByUserValue = Array.isArray(entry.updated_by_user)
        ? (entry.updated_by_user[0] ?? null)
        : (entry.updated_by_user ?? null);

      return {
        id: String(entry.id),
        title: typeof entry.title === 'string' ? entry.title : '',
        status: (entry.status ?? 'draft') as 'draft' | 'sent' | 'accepted' | 'rejected',
        created_at: entry.created_at ?? null,
        sent_at: entry.sent_at ?? null,
        decided_at: entry.decided_at ?? null,
        decision: (entry.decision ?? null) as 'accepted' | 'rejected' | null,
        pdf_url: entry.pdf_url ?? null,
        recipient_id: entry.recipient_id ?? null,
        recipient: recipientValue,
        ...(typeof entry.user_id === 'string' ? { user_id: entry.user_id } : {}),
        ...(typeof entry.created_by === 'string' ? { created_by: entry.created_by } : {}),
        updated_by: typeof entry.updated_by === 'string' ? entry.updated_by : null,
        team_id: typeof entry.team_id === 'string' ? entry.team_id : null,
        created_by_user: createdByUserValue
          ? {
              id: createdByUserValue.id || '',
              email: createdByUserValue.email || '',
            }
          : null,
        updated_by_user: updatedByUserValue
          ? {
              id: updatedByUserValue.id || '',
              email: updatedByUserValue.email || '',
            }
          : null,
      };
    });

    // Extract cursor from last item
    const nextCursor = hasNext && transformedItems.length > 0 ? extractCursor(pageItems) : null;

    const result: CursorPaginationResult<(typeof transformedItems)[0]> = {
      items: transformedItems,
      hasNext,
      nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
      estimatedTotal: typeof count === 'number' ? count : null,
    };

    log.info('Fetched offers with cursor pagination', {
      itemCount: transformedItems.length,
      hasNext,
      cursor: cursor ? 'provided' : 'none',
    });

    return NextResponse.json(result);
  }),
);
