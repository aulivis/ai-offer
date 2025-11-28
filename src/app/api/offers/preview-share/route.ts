import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import { handleValidationError } from '@/lib/errorHandling';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { v4 as uuid } from 'uuid';

/**
 * Generate a secure random token for share links
 */
function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

const previewShareRequestSchema = z.object({
  title: z.string().trim().min(1).max(500),
  projectDetails: z.record(z.string(), z.string()).optional(),
  projectDetailsText: z.string().optional(),
  previewHtml: z.string().trim().min(1),
  pricingRows: z.array(
    z.object({
      name: z.string().trim().min(1),
      qty: z.number().min(0),
      unit: z.string().optional(),
      unitPrice: z.number().min(0),
      vat: z.number().min(0).max(100).optional(),
    }),
  ),
  templateId: z.string().trim().optional(),
  brandingPrimary: z.string().optional(),
  brandingSecondary: z.string().optional(),
  brandingLogoUrl: z.string().url().optional().or(z.literal('')),
  schedule: z.array(z.string().trim()).optional(),
  testimonials: z.array(z.string().trim()).optional(),
  guarantees: z.array(z.string().trim()).optional(),
});

/**
 * POST /api/offers/preview-share
 * Create a temporary preview share link for wizard preview
 * This creates a temporary offer and share link that expires in 1 hour
 */
export const POST = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const bodyParsed = previewShareRequestSchema.safeParse(body);
    if (!bodyParsed.success) {
      return handleValidationError(bodyParsed.error, requestId);
    }

    const {
      title,
      projectDetails,
      projectDetailsText: _projectDetailsText, // Unused but part of schema for future use
      previewHtml,
      pricingRows,
      templateId,
      brandingPrimary,
      brandingSecondary,
      brandingLogoUrl,
      schedule,
      testimonials,
      guarantees,
    } = bodyParsed.data;

    const sb = await supabaseServer();

    // Sanitize inputs
    const safeTitle = sanitizeInput(title);
    const safeHtml = sanitizeHTML(previewHtml);
    const normalizedDetails = projectDetails || {};
    const resolvedTemplateId = templateId || 'free.minimal.html@1.0.0';

    // Create temporary offer (marked as preview in inputs metadata)
    const offerId = uuid();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    const { error: offerInsertError } = await sb.from('offers').insert({
      id: offerId,
      user_id: request.user.id,
      created_by: request.user.id,
      title: safeTitle,
      recipient_id: null,
      inputs: {
        projectDetails: normalizedDetails,
        preview: true, // Mark as preview
        deadline: '',
        language: 'hu',
        brandVoice: 'professional',
        style: 'detailed',
        templateId: resolvedTemplateId,
        branding: {
          primaryColor: brandingPrimary || undefined,
          secondaryColor: brandingSecondary || undefined,
          logoUrl: brandingLogoUrl || undefined,
        },
      },
      ai_text: safeHtml,
      schedule: (schedule || []).map((item) => sanitizeInput(item)).filter(Boolean),
      testimonials: (testimonials || []).map((item) => sanitizeInput(item)).filter(Boolean),
      guarantees: (guarantees || []).map((item) => sanitizeInput(item)).filter(Boolean),
      price_json: pricingRows.map(({ name, qty, unit, unitPrice, vat }) => ({
        name,
        qty,
        unit: unit || undefined,
        unitPrice,
        vat: vat || undefined,
      })),
      pdf_url: null,
      status: 'draft', // Preview offers are drafts
    });

    if (offerInsertError) {
      log.error('Preview offer insert error', offerInsertError);
      return NextResponse.json({ error: 'Failed to create preview offer' }, { status: 500 });
    }

    // Create temporary share link (expires in 1 hour)
    const token = generateShareToken();

    const { data: share, error: shareError } = await sb
      .from('offer_shares')
      .insert({
        offer_id: offerId,
        user_id: request.user.id,
        token,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (shareError) {
      log.error('Preview share insert error', shareError);
      // Cleanup offer if share creation fails
      await sb.from('offers').delete().eq('id', offerId);
      return NextResponse.json({ error: 'Failed to create preview share' }, { status: 500 });
    }

    // Build share URL
    const shareUrl = `${envServer.APP_URL}/offer/${token}`;

    log.info('Preview share link created', { shareId: share.id, offerId, expiresAt });

    return NextResponse.json({
      shareId: share.id,
      shareUrl,
      token: share.token,
      expiresAt: share.expires_at,
      offerId,
    });
  } catch (error) {
    log.error('Unexpected error during preview share creation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
