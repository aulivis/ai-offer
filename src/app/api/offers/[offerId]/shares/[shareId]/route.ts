import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { handleValidationError, HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';

const shareParamsSchema = z.object({
  offerId: uuidSchema,
  shareId: uuidSchema,
});

type RouteParams = {
  params: Promise<{
    offerId?: string;
    shareId?: string;
  }>;
};

/**
 * DELETE /api/offers/[offerId]/shares/[shareId]
 * Revoke (deactivate) a share link
 */
export const DELETE = withAuth(
  withAuthenticatedErrorHandling(
    async (request: AuthenticatedNextRequest, context: RouteParams) => {
      const requestId = getRequestId(request);
      const log = createLogger(requestId);
      log.setContext({ userId: request.user.id });

      // Validate route parameters
      const resolvedParams = await context.params;
      const parsed = shareParamsSchema.safeParse(resolvedParams);
      if (!parsed.success) {
        return handleValidationError(parsed.error, requestId);
      }

      const { offerId, shareId } = parsed.data;
      log.setContext({ userId: request.user.id, offerId, shareId });

      // Verify offer exists and belongs to user
      const sb = await supabaseServer();
      const { data: offer, error: offerError } = await sb
        .from('offers')
        .select('id, user_id')
        .eq('id', offerId)
        .maybeSingle();

      if (offerError) {
        log.error('Failed to load offer', offerError);
        throw offerError;
      }

      if (!offer) {
        return createErrorResponse('Offer not found', HttpStatus.NOT_FOUND);
      }

      if (offer.user_id !== request.user.id) {
        log.warn('Unauthorized share revocation attempt');
        return createErrorResponse('Unauthorized', HttpStatus.FORBIDDEN);
      }

      // Verify share exists and belongs to this offer
      const { data: share, error: shareError } = await sb
        .from('offer_shares')
        .select('id, offer_id, user_id')
        .eq('id', shareId)
        .eq('offer_id', offerId)
        .maybeSingle();

      if (shareError) {
        log.error('Failed to load share', shareError);
        throw shareError;
      }

      if (!share) {
        return createErrorResponse('Share not found', HttpStatus.NOT_FOUND);
      }

      if (share.user_id !== request.user.id) {
        log.warn('Unauthorized share revocation attempt');
        return createErrorResponse('Unauthorized', HttpStatus.FORBIDDEN);
      }

      // Deactivate the share (soft delete)
      const { error: updateError } = await sb
        .from('offer_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (updateError) {
        log.error('Failed to revoke share', updateError);
        throw updateError;
      }

      log.info('Share revoked', { shareId, offerId });

      return NextResponse.json({ success: true });
    },
  ),
);
