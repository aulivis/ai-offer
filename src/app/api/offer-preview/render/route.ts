import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { loadTemplate } from '@/app/pdf/templates/registry';
import { createThemeTokens, normalizeBranding } from '@/app/pdf/templates/theme';
import type { TemplateId } from '@/app/pdf/templates/types';
import { hu } from '@/copy';
import { sanitizeHTML } from '@/lib/sanitize';
import type { PriceRow } from '@/app/lib/pricing';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

export const runtime = 'nodejs';

const MAX_ROW_COUNT = 100;
const CSP_DIRECTIVE =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src data:; connect-src 'none'; frame-ancestors 'none'";

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

function injectCspMeta(html: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP_DIRECTIVE}" />`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n    ${meta}`);
  }
  return html;
}

async function handlePost(req: AuthenticatedNextRequest) {
  const parsed = previewRequestSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Érvénytelen előnézeti kérés.',
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { title, companyName, bodyHtml, rows, templateId, legacyTemplateId, locale, branding } =
    parsed.data;

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

  const html = buildOfferHtml(
    {
      offer: {
        title: title ?? 'Árajánlat',
        companyName: companyName ?? '',
        bodyHtml: safeBody,
        templateId: template.id,
        legacyTemplateId: resolvedLegacyId,
        locale: locale ?? 'hu',
      },
      rows: normalizedRows,
      branding: normalizedBranding,
      i18n: hu,
      tokens: createThemeTokens(normalizedBranding),
    },
    template,
  );

  const htmlWithCsp = injectCspMeta(html);

  return new NextResponse(htmlWithCsp, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Security-Policy': CSP_DIRECTIVE,
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export const POST = withAuth(handlePost);
