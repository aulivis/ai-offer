import { NextResponse } from 'next/server';
import { z } from 'zod';

import { renderOfferHtml } from '@/lib/offers/renderer';
import { createTranslator, resolveLocale } from '@/copy';
import { sanitizeHTML, sanitizeInput } from '@/lib/sanitize';
import type { PriceRow } from '@/app/lib/pricing';
import type { TemplateId } from '@/lib/offers/templates/types';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { handleValidationError } from '@/lib/errorHandling';
import { formatOfferIssueDate } from '@/lib/datetime';
import { PREVIEW_CSP_DIRECTIVE, injectPreviewCspMeta } from '@/lib/previewSecurity';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withRequestSizeLimit } from '@/lib/requestSizeLimit';

export const runtime = 'nodejs';

const MAX_ROW_COUNT = 100;
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : undefined),
  z.string().optional(),
);

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' ? value : undefined),
  z.string().optional(),
);

const numericField = z.preprocess((value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}, z.number().finite().optional());

const priceRowSchema = z
  .object({
    name: optionalTrimmedString,
    qty: numericField,
    unit: optionalTrimmedString,
    unitPrice: numericField,
    vat: numericField,
  })
  .strict();

const brandingSchema = z
  .object({
    primaryColor: optionalTrimmedString,
    secondaryColor: optionalTrimmedString,
    logoUrl: optionalTrimmedString,
  })
  .partial()
  .optional();

const stringArrayField = z.array(optionalTrimmedString).optional();

const previewRequestSchema = z
  .object({
    title: optionalTrimmedString,
    companyName: optionalTrimmedString,
    bodyHtml: optionalString,
    rows: z.array(priceRowSchema).max(MAX_ROW_COUNT).optional(),
    locale: optionalTrimmedString,
    branding: brandingSchema,
    issueDate: optionalTrimmedString,
    contactName: optionalTrimmedString,
    contactEmail: optionalTrimmedString,
    contactPhone: optionalTrimmedString,
    companyWebsite: optionalTrimmedString,
    companyAddress: optionalTrimmedString,
    companyTaxId: optionalTrimmedString,
    schedule: stringArrayField,
    testimonials: stringArrayField,
    guarantees: stringArrayField,
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string().optional(),
          key: z.string().optional(),
        }),
      )
      .optional(),
    templateId: optionalTrimmedString, // Support template selection
    formality: z.enum(['tegeződés', 'magázódás']).optional(),
    tone: z.enum(['friendly', 'formal']).optional(),
    customerName: optionalTrimmedString, // Customer name for welcome line
  })
  .strict();

function normalizeRows(rows: PriceRow[] | undefined): PriceRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.slice(0, MAX_ROW_COUNT).map((row) => ({
    name: typeof row.name === 'string' ? row.name : undefined,
    qty: typeof row.qty === 'number' && Number.isFinite(row.qty) ? row.qty : undefined,
    unit: typeof row.unit === 'string' ? row.unit : undefined,
    unitPrice:
      typeof row.unitPrice === 'number' && Number.isFinite(row.unitPrice)
        ? row.unitPrice
        : undefined,
    vat: typeof row.vat === 'number' && Number.isFinite(row.vat) ? row.vat : undefined,
  }));
}

async function handlePost(req: AuthenticatedNextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (error) {
    if (req.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      return new NextResponse(null, { status: 499 });
    }
    log.warn('Failed to read request body', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return NextResponse.json(
      {
        error: 'Érvénytelen előnézeti kérés.',
        requestId,
        issues: {
          fieldErrors: {},
          formErrors: ['Érvénytelen JSON törzs.'],
        },
      },
      { status: 400 },
    );
  }

  if (req.signal.aborted) {
    return new NextResponse(null, { status: 499 });
  }

  if (!rawBody) {
    return NextResponse.json(
      {
        error: 'Érvénytelen előnézeti kérés.',
        requestId,
        issues: {
          fieldErrors: {},
          formErrors: ['Érvénytelen JSON törzs.'],
        },
      },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch (error) {
    log.warn('Failed to parse request JSON body', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return NextResponse.json(
      {
        error: 'Érvénytelen előnézeti kérés.',
        requestId,
        issues: {
          fieldErrors: {},
          formErrors: ['Érvénytelen JSON törzs.'],
        },
      },
      { status: 400 },
    );
  }

  const parsed = previewRequestSchema.safeParse(json);

  if (!parsed.success) {
    return handleValidationError(parsed.error, requestId);
  }

  const {
    title,
    companyName,
    bodyHtml,
    rows,
    locale,
    branding,
    issueDate,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
    schedule,
    testimonials,
    guarantees,
    images,
    templateId,
    formality,
    tone,
    customerName,
  } = parsed.data;

  const safeBody = sanitizeHTML((bodyHtml ?? '').trim() || '<p>(nincs előnézet)</p>');
  const normalizedRows = normalizeRows(rows as PriceRow[] | undefined);

  const resolvedLocale = resolveLocale(locale);
  const translator = createTranslator(resolvedLocale);
  const defaultTitle = translator.t('pdf.templates.common.defaultTitle');

  const sanitizeList = (items?: Array<string | null | undefined>): string[] =>
    Array.isArray(items)
      ? items
          .map((item) => (typeof item === 'string' ? sanitizeInput(item) : ''))
          .filter((item) => Boolean(item && item.trim().length > 0))
      : [];

  const sanitizedSchedule = sanitizeList(schedule);
  const sanitizedTestimonials = sanitizeList(testimonials);
  const sanitizedGuarantees = sanitizeList(guarantees);

  let html: string;

  try {
    html = renderOfferHtml(
      {
        title: (title ?? defaultTitle) || defaultTitle,
        companyName: companyName ?? '',
        bodyHtml: safeBody,
        locale: resolvedLocale,
        issueDate: sanitizeInput(
          issueDate && issueDate.length > 0
            ? issueDate
            : formatOfferIssueDate(new Date(), resolvedLocale),
        ),
        contactName: sanitizeInput(contactName ?? ''),
        contactEmail: sanitizeInput(contactEmail ?? ''),
        contactPhone: sanitizeInput(contactPhone ?? ''),
        companyWebsite: sanitizeInput(companyWebsite ?? ''),
        companyAddress: sanitizeInput(companyAddress ?? ''),
        companyTaxId: sanitizeInput(companyTaxId ?? ''),
        schedule: sanitizedSchedule,
        testimonials: sanitizedTestimonials.length ? sanitizedTestimonials : null,
        guarantees: sanitizedGuarantees.length ? sanitizedGuarantees : null,
        pricingRows: normalizedRows,
        images: (images || []).map((img) => ({
          src: img.src,
          alt: img.alt || 'Image',
          ...(img.key && { key: img.key }),
        })),
        ...(branding && {
          branding: {
            primaryColor: branding.primaryColor ?? null,
            secondaryColor: branding.secondaryColor ?? null,
            logoUrl: branding.logoUrl ?? null,
          },
        }),
        ...(templateId && { templateId: templateId as TemplateId }),
        ...(formality && { formality: formality as 'tegeződés' | 'magázódás' }),
        ...(tone && { tone: tone as 'friendly' | 'formal' }),
        ...(customerName && { customerName }),
      },
      translator,
    );
  } catch (error) {
    log.error('Offer render failed', error);
    throw error;
  }

  const htmlWithCsp = injectPreviewCspMeta(html);

  return new NextResponse(htmlWithCsp, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Security-Policy': PREVIEW_CSP_DIRECTIVE,
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export const POST = withAuth(
  withRequestSizeLimit(
    withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
      return handlePost(req);
    }),
  ),
);
