import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../../middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { handleValidationError, handleUnexpectedError } from '@/lib/errorHandling';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { uuidSchema } from '@/lib/validation/schemas';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { loadTemplate } from '@/app/pdf/templates/engineRegistry';
import { normalizeBranding } from '@/app/pdf/templates/theme';
import type { TemplateId } from '@/app/pdf/templates/types';
import { createTranslator, resolveLocale } from '@/copy';
import type { PriceRow } from '@/app/lib/pricing';
import { sanitizeHTML, sanitizeInput } from '@/lib/sanitize';
import { formatOfferIssueDate } from '@/lib/datetime';
import { enqueuePdfJob, dispatchPdfJob } from '@/lib/queue/pdf';
import { getUserProfile } from '@/lib/services/user';
import { resolveEffectivePlan } from '@/lib/subscription';
import { currentMonthStart } from '@/lib/utils/dateHelpers';
import { getUsageSnapshot } from '@/lib/services/usage';
import { v4 as uuid } from 'uuid';
import type { PdfJobInput } from '@/lib/queue/pdf';

const offerIdParamsSchema = z.object({
  offerId: uuidSchema,
});

const FALLBACK_TITLE = 'ajanlat';
const FALLBACK_CUSTOMER_NAME = 'ugyfel';
const MAX_FILENAME_PART_LENGTH = 50;

function sanitizeFileNamePart(value: string | null | undefined, fallback: string): string {
  const base = typeof value === 'string' ? value : '';
  const normalise = (input: string) =>
    input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 _-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const sanitizedFallback = normalise(fallback) || FALLBACK_TITLE;
  const sanitized = normalise(base);
  const candidate = sanitized || sanitizedFallback;
  return candidate.slice(0, MAX_FILENAME_PART_LENGTH);
}

function createOfferStoragePath(params: {
  userId: string;
  offerId: string;
  customerName?: string | null;
  offerTitle?: string | null;
  fallbackCompany?: string | null;
  date?: Date;
}): string {
  const { userId, offerId, customerName, offerTitle, fallbackCompany, date } = params;
  const issuedAt = (date ?? new Date()).toISOString().slice(0, 10);
  const customerPart = sanitizeFileNamePart(
    customerName ?? fallbackCompany ?? FALLBACK_CUSTOMER_NAME,
    FALLBACK_CUSTOMER_NAME,
  );
  const titlePart = sanitizeFileNamePart(offerTitle ?? FALLBACK_TITLE, FALLBACK_TITLE);
  const fileName = `${customerPart} - ${titlePart} - ${issuedAt}.pdf`;
  return `${userId}/${offerId}/${fileName}`;
}

type RouteParams = {
  params: Promise<{
    offerId?: string;
  }>;
};

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
    const sb = await supabaseServer();

    // Load offer and verify ownership
    const { data: offer, error: offerError } = await sb
      .from('offers')
      .select('id, user_id, title, ai_text, price_json, inputs, recipient_id')
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
      log.warn('Unauthorized PDF regeneration attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user profile and plan
    const profile = await getUserProfile(sb, request.user.id);
    const plan = resolveEffectivePlan(profile?.plan ?? null);
    const planLimit = plan === 'pro' ? null : plan === 'standard' ? 5 : 2;

    // Get user's branding
    const { data: brandingData } = await sb
      .from('user_profiles')
      .select('primary_color, secondary_color, logo_url')
      .eq('user_id', request.user.id)
      .maybeSingle();

    const normalizedBranding = normalizeBranding(
      brandingData
        ? {
            primaryColor: brandingData.primary_color ?? null,
            secondaryColor: brandingData.secondary_color ?? null,
            logoUrl: brandingData.logo_url ?? null,
          }
        : undefined,
    );

    // Get offer inputs
    const inputs = (offer.inputs as Record<string, unknown>) || {};
    const templateId =
      (typeof inputs.templateId === 'string' ? inputs.templateId : null) || 'modern';
    const locale = (typeof inputs.language === 'string' ? inputs.language : 'hu') || 'hu';
    const resolvedLocale = resolveLocale(locale);

    // Load template
    const template = loadTemplate(templateId as TemplateId);
    const translator = createTranslator(resolvedLocale);

    // Get recipient info for storage path
    let customerName: string | null = null;
    if (offer.recipient_id) {
      const { data: recipient } = await sb
        .from('recipients')
        .select('company_name')
        .eq('id', offer.recipient_id)
        .maybeSingle();
      customerName = recipient?.company_name || null;
    }

    // Build storage path
    const storagePath = createOfferStoragePath({
      userId: request.user.id,
      offerId,
      customerName,
      offerTitle: offer.title,
      fallbackCompany: null,
    });

    // Rebuild HTML from offer data
    const aiHtml = typeof offer.ai_text === 'string' ? offer.ai_text : '';
    const safeBody = sanitizeHTML(aiHtml);

    // Normalize price rows
    const priceRows = Array.isArray(offer.price_json) ? offer.price_json : [];
    const normalizedRows = priceRows.map((row: unknown) => {
      const priceRow = row as Partial<PriceRow>;
      return {
        name: typeof priceRow.name === 'string' ? priceRow.name : undefined,
        qty:
          typeof priceRow.qty === 'number' && Number.isFinite(priceRow.qty)
            ? priceRow.qty
            : undefined,
        unit: typeof priceRow.unit === 'string' ? priceRow.unit : undefined,
        unitPrice:
          typeof priceRow.unitPrice === 'number' && Number.isFinite(priceRow.unitPrice)
            ? priceRow.unitPrice
            : undefined,
        vat:
          typeof priceRow.vat === 'number' && Number.isFinite(priceRow.vat)
            ? priceRow.vat
            : undefined,
      };
    });

    // Get company info from profile
    const { data: profileData } = await sb
      .from('user_profiles')
      .select(
        'company_name, company_address, company_tax_id, contact_name, contact_email, contact_phone, company_website',
      )
      .eq('user_id', request.user.id)
      .maybeSingle();

    const companyName = profileData?.company_name || '';
    const issueDate = formatOfferIssueDate(new Date(), resolvedLocale);

    // Build HTML
    const html = buildOfferHtml({
      offer: {
        title: offer.title || '',
        companyName,
        bodyHtml: safeBody,
        templateId: template.id,
        locale: resolvedLocale,
        issueDate,
        contactName: sanitizeInput(profileData?.contact_name ?? ''),
        contactEmail: sanitizeInput(profileData?.contact_email ?? ''),
        contactPhone: sanitizeInput(profileData?.contact_phone ?? ''),
        companyWebsite: sanitizeInput(profileData?.company_website ?? ''),
        companyAddress: sanitizeInput(profileData?.company_address ?? ''),
        companyTaxId: sanitizeInput(profileData?.company_tax_id ?? ''),
      },
      rows: normalizedRows,
      branding: normalizedBranding,
      i18n: translator,
      templateId: template.id,
    });

    // Check quota
    const { iso: usagePeriodStart } = currentMonthStart();
    const usageSnapshot = await getUsageSnapshot(sb, request.user.id, usagePeriodStart);

    if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
      if (usageSnapshot.offersGenerated >= planLimit) {
        return NextResponse.json(
          { error: translator.t('quotaWarningBar.message.user') },
          { status: 402 },
        );
      }
    }

    // Create PDF job
    const downloadToken = uuid();
    const serviceClient = supabaseServiceRole();

    const pdfJobInput: PdfJobInput = {
      jobId: downloadToken,
      offerId,
      userId: request.user.id,
      storagePath,
      html,
      callbackUrl: null,
      usagePeriodStart,
      userLimit: typeof planLimit === 'number' && Number.isFinite(planLimit) ? planLimit : null,
      deviceId: null,
      deviceLimit: null,
      templateId: template.id,
      requestedTemplateId: template.id,
    };

    try {
      await enqueuePdfJob(serviceClient, pdfJobInput);
    } catch (error) {
      log.error('PDF queue error (enqueue)', error);
      return NextResponse.json(
        { error: translator.t('errors.offer.savePdfFailed') },
        { status: 500 },
      );
    }

    // Dispatch PDF job
    try {
      await dispatchPdfJob(serviceClient, downloadToken);
    } catch (dispatchError) {
      log.warn('PDF queue error (dispatch)', {
        error: dispatchError,
        message: dispatchError instanceof Error ? dispatchError.message : String(dispatchError),
      });
      // Job is enqueued, it will be processed by the worker
    }

    log.info('PDF regeneration job created', { offerId, jobId: downloadToken });

    return NextResponse.json({
      ok: true,
      jobId: downloadToken,
      status: 'pending',
      message: translator.t('api.pdf.processing'),
    });
  } catch (error) {
    return handleUnexpectedError(error, requestId, log);
  }
});
