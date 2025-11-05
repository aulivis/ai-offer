import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { loadTemplate } from '@/app/pdf/templates/engineRegistry';
import { normalizeBranding } from '@/app/pdf/templates/theme';
import type { TemplateId } from '@/app/pdf/templates/types';
import { createTranslator, resolveLocale } from '@/copy';
import { sanitizeHTML, sanitizeInput } from '@/lib/sanitize';
import type { PriceRow } from '@/app/lib/pricing';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import {
  recordTemplateRenderTelemetry,
  resolveTemplateRenderErrorCode,
} from '@/lib/observability/templateTelemetry';
import { formatOfferIssueDate } from '@/lib/datetime';
import { PREVIEW_CSP_DIRECTIVE, injectPreviewCspMeta } from '@/lib/previewSecurity';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { handleValidationError, handleUnexpectedError } from '@/lib/errorHandling';
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

const previewRequestSchema = z
  .object({
    title: optionalTrimmedString,
    companyName: optionalTrimmedString,
    bodyHtml: optionalString,
    rows: z.array(priceRowSchema).max(MAX_ROW_COUNT).optional(),
    templateId: z.string().trim().min(1, 'templateId is required'),
    legacyTemplateId: optionalTrimmedString,
    locale: optionalTrimmedString,
    branding: brandingSchema,
    issueDate: optionalTrimmedString,
    contactName: optionalTrimmedString,
    contactEmail: optionalTrimmedString,
    contactPhone: optionalTrimmedString,
    companyWebsite: optionalTrimmedString,
    companyAddress: optionalTrimmedString,
    companyTaxId: optionalTrimmedString,
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
    log.warn('Failed to read request body', error);
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
    log.warn('Failed to parse request JSON body', error);
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
    templateId,
    legacyTemplateId,
    locale,
    branding,
    issueDate,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
  } = parsed.data;

  let template;
  try {
    template = loadTemplate(templateId as TemplateId);
  } catch {
    return NextResponse.json({ error: 'Ismeretlen sablon az előnézethez.' }, { status: 400 });
  }

  const normalizedBranding = normalizeBranding({
    primaryColor: branding?.primaryColor ?? null,
    secondaryColor: branding?.secondaryColor ?? null,
    logoUrl: branding?.logoUrl ?? null,
  });

  const safeBody = sanitizeHTML((bodyHtml ?? '').trim() || '<p>(nincs előnézet)</p>');
  const normalizedRows = normalizeRows(rows as PriceRow[] | undefined);
  const templateLegacyId = (template as { legacyId?: string }).legacyId;
  const resolvedLegacyId =
    legacyTemplateId && legacyTemplateId.length > 0
      ? legacyTemplateId
      : (templateLegacyId ?? 'modern');

  const resolvedLocale = resolveLocale(locale);
  const translator = createTranslator(resolvedLocale);
  const defaultTitle = translator.t('pdf.templates.common.defaultTitle');

  const renderStartedAt = performance.now();
  let renderDuration: number | null = null;
  let html: string;

  try {
    html = buildOfferHtml({
      offer: {
        title: (title ?? defaultTitle) || defaultTitle,
        companyName: companyName ?? '',
        bodyHtml: safeBody,
        templateId: template.id,
        legacyTemplateId: resolvedLegacyId,
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
      },
      rows: normalizedRows,
      branding: normalizedBranding,
      i18n: translator,
      templateId: template.id,
    });
    renderDuration = performance.now() - renderStartedAt;
  } catch (error) {
    renderDuration = performance.now() - renderStartedAt;
    log.error('Template render failed', error, { templateId: template.id });
    await recordTemplateRenderTelemetry({
      templateId: template.id,
      renderer: 'api.offer_preview.render',
      outcome: 'failure',
      renderMs: renderDuration,
      errorCode: resolveTemplateRenderErrorCode(error),
    });
    return handleUnexpectedError(error, requestId, log);
  }

  await recordTemplateRenderTelemetry({
    templateId: template.id,
    renderer: 'api.offer_preview.render',
    outcome: 'success',
    renderMs: renderDuration,
  });

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

export const POST = withAuth(withRequestSizeLimit(handlePost));
