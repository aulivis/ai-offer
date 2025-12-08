import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';
import { envServer } from '@/env.server';
import { getUserProfile } from '@/lib/services/user';
import { resolveEffectivePlan } from '@/lib/subscription';
import { createTranslator } from '@/copy';

const offerIdParamsSchema = z.object({
  offerId: uuidSchema,
});

const createShareRequestSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerName: z.string().trim().max(200).optional().or(z.literal('')),
});

type RouteParams = {
  params: Promise<{
    offerId?: string;
  }>;
};

/**
 * Generate a secure random token for share links
 * Uses 32 bytes (256 bits) for cryptographic security
 */
function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * POST /api/offers/[offerId]/share
 * Create a shareable link for an offer
 */
export const POST = withAuth(async (request: AuthenticatedNextRequest, context: RouteParams) => {
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
    // Check user plan - sharing is only available for standard/pro users
    const sb = await supabaseServer();
    const profile = await getUserProfile(sb, request.user.id);
    const plan = resolveEffectivePlan(profile?.plan ?? null);

    if (plan === 'free') {
      const translator = createTranslator(request.headers.get('accept-language'));
      return NextResponse.json(
        {
          error:
            translator.t('errors.featureRequiresUpgrade') || 'This feature requires a paid plan',
          requiresUpgrade: true,
          feature: 'offer_sharing',
        },
        { status: 402 },
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const bodyParsed = createShareRequestSchema.safeParse(body);
    if (!bodyParsed.success) {
      return handleValidationError(bodyParsed.error, requestId);
    }

    const { expiresAt, customerEmail, customerName } = bodyParsed.data;

    // Verify offer exists and belongs to user
    const { data: offer, error: offerError } = await sb
      .from('offers')
      .select('id, user_id, title')
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
      log.warn('Unauthorized share creation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate secure token
    const token = generateShareToken();

    // Parse expiration date if provided
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
    if (expiresAtDate && isNaN(expiresAtDate.getTime())) {
      return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
    }

    // Create share record
    const { data: share, error: shareError } = await sb
      .from('offer_shares')
      .insert({
        offer_id: offerId,
        user_id: request.user.id,
        token,
        expires_at: expiresAtDate,
        customer_email: customerEmail || null,
        customer_name: customerName || null,
      })
      .select()
      .single();

    if (shareError) {
      log.error('Failed to create share', shareError);
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
    }

    // Build share URL
    const shareUrl = `${envServer.APP_URL}/offer/${token}`;

    log.info('Share link created', { shareId: share.id, offerId });

    return NextResponse.json({
      shareId: share.id,
      shareUrl,
      token: share.token,
      expiresAt: share.expires_at,
      createdAt: share.created_at,
    });
  } catch (error) {
    log.error('Unexpected error during share creation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

/**
 * GET /api/offers/[offerId]/share
 * List all share links for an offer
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
    // Check user plan - sharing is only available for standard/pro users
    const sb = await supabaseServer();
    const profile = await getUserProfile(sb, request.user.id);
    const plan = resolveEffectivePlan(profile?.plan ?? null);

    if (plan === 'free') {
      const translator = createTranslator(request.headers.get('accept-language'));
      return NextResponse.json(
        {
          error:
            translator.t('errors.featureRequiresUpgrade') || 'This feature requires a paid plan',
          requiresUpgrade: true,
          feature: 'offer_sharing',
        },
        { status: 402 },
      );
    }

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
      log.warn('Unauthorized share list attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all shares for this offer
    const { data: shares, error: sharesError } = await sb
      .from('offer_shares')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (sharesError) {
      log.error('Failed to load shares', sharesError);
      return NextResponse.json({ error: 'Failed to load shares' }, { status: 500 });
    }

    // Build share URLs
    const sharesWithUrls = (shares || []).map((share) => ({
      id: share.id,
      token: share.token,
      shareUrl: `${envServer.APP_URL}/offer/${share.token}`,
      expiresAt: share.expires_at,
      isActive: share.is_active,
      accessCount: share.access_count,
      lastAccessedAt: share.last_accessed_at,
      customerEmail: share.customer_email,
      customerName: share.customer_name,
      createdAt: share.created_at,
    }));

    return NextResponse.json({ shares: sharesWithUrls });
  } catch (error) {
    log.error('Unexpected error during share list', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
