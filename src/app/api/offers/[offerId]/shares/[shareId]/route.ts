import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';

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
export const DELETE = withAuth(async (request: AuthenticatedNextRequest, context: RouteParams) => {
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

  try {
    // Verify offer exists and belongs to user
    const sb = await supabaseServer();
    const { data: offer, error: offerError } = await sb
      .from('offers')
      .select('id, user_id')
      .eq('id', offerId)
      .maybeSingle();

    if (offerError) {
      log.error('Failed to load offer', offerError);
      return NextResponse.json({ error: 'Failed to load offer' }, { status: 500 });
    }

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.user_id !== request.user.id) {
      log.warn('Unauthorized share revocation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
      return NextResponse.json({ error: 'Failed to load share' }, { status: 500 });
    }

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.user_id !== request.user.id) {
      log.warn('Unauthorized share revocation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deactivate the share (soft delete)
    const { error: updateError } = await sb
      .from('offer_shares')
      .update({ is_active: false })
      .eq('id', shareId);

    if (updateError) {
      log.error('Failed to revoke share', updateError);
      return NextResponse.json({ error: 'Failed to revoke share' }, { status: 500 });
    }

    log.info('Share revoked', { shareId, offerId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Unexpected error during share revocation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
