import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { renderRuntimePdfHtml } from '@/lib/pdfRuntime';
import { getTemplateMeta } from '@/app/pdf/templates/registry';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { createExternalPdfJob } from '@/lib/pdfExternalApi';

/**
 * POST /api/pdf/export
 * 
 * Public API endpoint for exporting PDFs using the runtime template system.
 * This endpoint is designed for external use (SDK, integrations, etc.)
 * and does not require authentication.
 * 
 * This endpoint uses Supabase Edge Functions for PDF generation, which is
 * compatible with Vercel's serverless function limitations.
 * 
 * The endpoint returns a job ID immediately and provides status polling
 * and webhook callback support.
 * 
 * @see {@link https://github.com/your-org/your-repo/wiki/PDF-Export-API Documentation}
 */
export const runtime = 'nodejs';

const HEX_COLOR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const hexColorSchema = z
  .string({ required_error: 'Color is required.' })
  .trim()
  .min(1, 'Color is required.')
  .refine((value) => HEX_COLOR_PATTERN.test(value), {
    message: 'Colors must be a valid 3- or 6-digit hex value.',
  });

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

function optionalUrlSchema(message: string) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, z.string().url({ message }).optional());
}

const brandSchema = z
  .object({
    name: z
      .string({ required_error: 'Brand name is required.' })
      .trim()
      .min(1, 'Brand name is required.'),
    logoUrl: optionalUrlSchema('Brand logo URL must be a valid URL.'),
    primaryHex: hexColorSchema,
    secondaryHex: hexColorSchema,
  })
  .strict();

const brandSlotSchema = z
  .object({
    name: z
      .string({ required_error: 'Brand display name is required.' })
      .trim()
      .min(1, 'Brand display name is required.'),
    logoUrl: optionalUrlSchema('Brand slot logo URL must be a valid URL.'),
  })
  .strict();

const docSchema = z
  .object({
    title: z
      .string({ required_error: 'Document title is required.' })
      .trim()
      .min(1, 'Document title is required.'),
    subtitle: optionalTrimmedString,
    date: z
      .string({ required_error: 'Document date is required.' })
      .trim()
      .min(1, 'Document date is required.'),
  })
  .strict();

const customerSchema = z
  .object({
    name: z
      .string({ required_error: 'Customer name is required.' })
      .trim()
      .min(1, 'Customer name is required.'),
    address: optionalTrimmedString,
    taxId: optionalTrimmedString,
  })
  .strict();

const itemSchema = z
  .object({
    name: z
      .string({ required_error: 'Item name is required.' })
      .trim()
      .min(1, 'Item name is required.'),
    qty: z.number({ required_error: 'Item quantity must be a number.' }),
    unitPrice: z.number({ required_error: 'Item unit price must be a number.' }),
    total: z.number({ required_error: 'Item total must be a number.' }),
    note: optionalTrimmedString,
  })
  .strict();

const totalsSchema = z
  .object({
    net: z.number({ required_error: 'Net total must be a number.' }),
    vat: z.number({ required_error: 'VAT total must be a number.' }),
    gross: z.number({ required_error: 'Gross total must be a number.' }),
    currency: z
      .string({ required_error: 'Currency is required.' })
      .trim()
      .min(1, 'Currency is required.'),
  })
  .strict();

const docSlotsSchema = z
  .object({
    brand: brandSlotSchema,
    doc: docSchema,
    customer: customerSchema,
    items: z.array(itemSchema).min(1, 'At least one item is required.'),
    totals: totalsSchema,
    notes: optionalTrimmedString,
  })
  .strict();

const exportRequestSchema = z
  .object({
    templateId: z
      .string({ required_error: 'templateId is required.' })
      .trim()
      .min(1, 'templateId is required.'),
    brand: brandSchema,
    slots: docSlotsSchema,
    callbackUrl: optionalUrlSchema('Callback URL must be a valid URL.').optional(),
    locale: z.string().optional(),
  })
  .strict();

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function internalError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest('Request body must be valid JSON.');
  }

  const parsed = exportRequestSchema.safeParse(json);
  if (!parsed.success) {
    return badRequest('Invalid request payload.', parsed.error.flatten());
  }

  const { templateId, brand, slots, callbackUrl, locale } = parsed.data;

  // Validate template
  const templateMeta = getTemplateMeta(templateId);
  if (!templateMeta) {
    return NextResponse.json(
      {
        error: `Unknown templateId "${templateId}".`,
        hint: 'Check the available PDF templates and try again.',
      },
      { status: 404 },
    );
  }

  // Create runtime template payload
  const runtimeTemplate = {
    templateId,
    locale: locale ?? null,
    brand: {
      name: brand.name,
      logoUrl: brand.logoUrl ?? null,
      primaryHex: brand.primaryHex,
      secondaryHex: brand.secondaryHex,
    },
    slots,
  };

  try {
    // Create PDF job using Supabase Edge Functions
    // This is Vercel-compatible and doesn't require Puppeteer in Next.js routes
    const { jobId, statusUrl, downloadUrl } = await createExternalPdfJob(
      '', // HTML will be generated from runtime template
      runtimeTemplate,
      callbackUrl ?? null,
    );

    log.info('External API PDF job created', {
      jobId,
      templateId,
      hasCallbackUrl: !!callbackUrl,
    });

    return NextResponse.json(
      {
        success: true,
        jobId,
        status: 'pending',
        statusUrl,
        downloadUrl,
        message: 'PDF generation job created successfully. Use the statusUrl to check job status, or wait for webhook callback if callbackUrl was provided.',
      },
      { status: 202 }, // 202 Accepted - async processing
    );
  } catch (error) {
    if (error instanceof Error && /invalid hex color/i.test(error.message)) {
      return badRequest('One or more brand colors are invalid hex values.');
    }
    
    log.error('Failed to create external PDF job', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create PDF job';
    return internalError(errorMessage);
  }
}
