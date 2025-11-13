import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';
import { envServer } from '@/env.server';

const offerIdParamsSchema = z.object({
  offerId: uuidSchema,
});

type RouteParams = {
  params: Promise<{
    offerId?: string;
  }>;
};

/**
 * GET /api/offers/[offerId]/default-share
 * Get the default (first active) share link for an offer
 */
export const GET = withAuth(async (request: AuthenticatedNextRequest, context: RouteParams) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  // Validate route parameters
  const resolvedParams = await context.params;
  const parsed = offerIdParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return handleValidationError(parsed.error, requestId);
  }

  const offerId = parsed.data.offerId;
  log.setContext({ userId: request.user.id, offerId });

  try {
    const sb = await supabaseServer();

    // Verify offer exists and belongs to user
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
      log.warn('Unauthorized default share access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the first active share for this offer (default share)
    const { data: share, error: shareError } = await sb
      .from('offer_shares')
      .select('id, token, is_active, expires_at')
      .eq('offer_id', offerId)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: true }) // Get the first (oldest) share as default
      .limit(1)
      .maybeSingle();

    if (shareError) {
      log.error('Failed to load default share', shareError);
      return NextResponse.json({ error: 'Failed to load share link' }, { status: 500 });
    }

    // If no share exists, create one (shouldn't happen due to trigger, but handle gracefully)
    if (!share) {
      log.warn('No default share found, creating one', { offerId });

      // Generate secure token
      const { randomBytes } = await import('crypto');
      const token = randomBytes(32).toString('base64url');

      const { data: newShare, error: createError } = await sb
        .from('offer_shares')
        .insert({
          offer_id: offerId,
          user_id: request.user.id,
          token,
          expires_at: null,
          is_active: true,
        })
        .select('id, token, is_active')
        .single();

      if (createError || !newShare) {
        log.error('Failed to create default share', createError);
        return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
      }

      const shareUrl = `${envServer.APP_URL}/offer/${newShare.token}`;
      return NextResponse.json({
        shareId: newShare.id,
        shareUrl,
        token: newShare.token,
        isActive: newShare.is_active,
      });
    }

    // Build share URL
    const shareUrl = `${envServer.APP_URL}/offer/${share.token}`;

    log.info('Default share link retrieved', { shareId: share.id, offerId });

    return NextResponse.json({
      shareId: share.id,
      shareUrl,
      token: share.token,
      isActive: share.is_active,
      expiresAt: share.expires_at,
    });
  } catch (error) {
    log.error('Unexpected error during default share retrieval', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
