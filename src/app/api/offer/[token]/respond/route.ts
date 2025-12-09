import { NextRequest, NextResponse } from 'next/server';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withErrorHandling } from '@/lib/errorHandling';
import { handleValidationError, HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { getRequestIp } from '@/lib/auditLogging';

const respondRequestSchema = z.object({
  decision: z.enum(['accepted', 'rejected', 'question']),
  comment: z.string().trim().max(1000).optional(),
  customerName: z.string().trim().max(200).optional(),
  customerEmail: z.string().email().max(200).optional(),
});

type RouteParams = {
  params: Promise<{
    token?: string;
  }>;
};

/**
 * POST /api/offer/[token]/respond
 * Submit customer response to a shared offer
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteParams) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);

  // Validate route parameters
  const resolvedParams = await context.params;
  const token = resolvedParams.token;

  if (!token || typeof token !== 'string') {
    return createErrorResponse('Invalid token', HttpStatus.BAD_REQUEST);
  }

  log.setContext({ token });

  // Parse request body
  const body = await request.json().catch(() => ({}));
  const bodyParsed = respondRequestSchema.safeParse(body);
  if (!bodyParsed.success) {
    return handleValidationError(bodyParsed.error, requestId);
  }

  const { decision, comment, customerName, customerEmail } = bodyParsed.data;

  const sb = await supabaseAnonServer();

  // Load share record
  const { data: share, error: shareError } = await sb
    .from('offer_shares')
    .select('id, offer_id, is_active, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (shareError) {
    log.error('Failed to load share', shareError);
    throw shareError;
  }

  if (!share) {
    return createErrorResponse('Share not found', HttpStatus.NOT_FOUND);
  }

  // Check if share is active
  if (!share.is_active) {
    return createErrorResponse('This share link has been revoked', HttpStatus.FORBIDDEN);
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return createErrorResponse('This share link has expired', HttpStatus.FORBIDDEN);
  }

  // Check if already responded
  const { data: existingResponse } = await sb
    .from('offer_responses')
    .select('id')
    .eq('share_id', share.id)
    .maybeSingle();

  if (existingResponse) {
    return createErrorResponse(
      'A response has already been submitted for this offer',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Get IP and user agent
  const ipAddress = getRequestIp(request);
  const userAgent = request.headers.get('user-agent') || '';

  // Create response
  const { data: response, error: responseError } = await sb
    .from('offer_responses')
    .insert({
      offer_id: share.offer_id,
      share_id: share.id,
      decision,
      comment: comment || null,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select()
    .single();

  if (responseError) {
    log.error('Failed to create response', responseError);
    throw responseError;
  }

  // Update offer with decision date and status when customer accepts or rejects
  // Use service role client to bypass RLS since this is a public endpoint
  if (decision === 'accepted' || decision === 'rejected') {
    const adminClient = supabaseServiceRole();
    const now = new Date().toISOString();
    const offerStatus = decision === 'accepted' ? 'accepted' : 'lost';
    const offerDecision = decision === 'accepted' ? 'accepted' : 'lost';

    const { error: offerUpdateError } = await adminClient
      .from('offers')
      .update({
        status: offerStatus,
        decision: offerDecision,
        decided_at: now,
      })
      .eq('id', share.offer_id);

    if (offerUpdateError) {
      log.error('Failed to update offer with decision', offerUpdateError, {
        offerId: share.offer_id,
        decision,
      });
      // Don't fail the request - response was already created
      // The offer update can be retried or done manually
    } else {
      log.info('Offer updated with decision', {
        offerId: share.offer_id,
        status: offerStatus,
        decided_at: now,
      });
    }
  }

  log.info('Response submitted', { responseId: response.id, offerId: share.offer_id, decision });

  return NextResponse.json({
    success: true,
    message: 'Response submitted successfully',
    responseId: response.id,
  });
});
