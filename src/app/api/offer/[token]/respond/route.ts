import { NextRequest, NextResponse } from 'next/server';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
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

  log.info('Response submitted', { responseId: response.id, offerId: share.offer_id, decision });

  return NextResponse.json({
    success: true,
    message: 'Response submitted successfully',
    responseId: response.id,
  });
});
