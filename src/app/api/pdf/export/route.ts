import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getTemplate, mapTemplateId } from '@/lib/offers/templates/index';
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
 * This endpoint uses Vercel-native Puppeteer for PDF generation (industry best practice).
 * Falls back to Supabase Edge Functions if Vercel-native is not available.
 *
 * The endpoint returns a job ID immediately and provides status polling
 * and webhook callback support.
 *
 * @see {@link https://github.com/your-org/your-repo/wiki/PDF-Export-API Documentation}
 */
export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan: 60s timeout

const HEX_COLOR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const hexColorSchema = z
  .string({ message: 'Color is required.' })
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
    name: z.string({ message: 'Brand name is required.' }).trim().min(1, 'Brand name is required.'),
    logoUrl: optionalUrlSchema('Brand logo URL must be a valid URL.'),
    primaryHex: hexColorSchema,
    secondaryHex: hexColorSchema,
  })
  .strict();

const brandSlotSchema = z
  .object({
    name: z
      .string({ message: 'Brand display name is required.' })
      .trim()
      .min(1, 'Brand display name is required.'),
    logoUrl: optionalUrlSchema('Brand slot logo URL must be a valid URL.'),
  })
  .strict();

const docSchema = z
  .object({
    title: z
      .string({ message: 'Document title is required.' })
      .trim()
      .min(1, 'Document title is required.'),
    subtitle: optionalTrimmedString,
    date: z
      .string({ message: 'Document date is required.' })
      .trim()
      .min(1, 'Document date is required.'),
  })
  .strict();

const customerSchema = z
  .object({
    name: z
      .string({ message: 'Customer name is required.' })
      .trim()
      .min(1, 'Customer name is required.'),
    address: optionalTrimmedString,
    taxId: optionalTrimmedString,
  })
  .strict();

const itemSchema = z
  .object({
    name: z.string({ message: 'Item name is required.' }).trim().min(1, 'Item name is required.'),
    qty: z.number({ message: 'Item quantity must be a number.' }),
    unitPrice: z.number({ message: 'Item unit price must be a number.' }),
    total: z.number({ message: 'Item total must be a number.' }),
    note: optionalTrimmedString,
  })
  .strict();

const totalsSchema = z
  .object({
    net: z.number({ message: 'Net total must be a number.' }),
    vat: z.number({ message: 'VAT total must be a number.' }),
    gross: z.number({ message: 'Gross total must be a number.' }),
    currency: z.string({ message: 'Currency is required.' }).trim().min(1, 'Currency is required.'),
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
      .string({ message: 'templateId is required.' })
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

  // Validate template (map old PDF template ID to new HTML template ID)
  const htmlTemplateId = mapTemplateId(templateId);
  try {
    getTemplate(htmlTemplateId);
  } catch {
    return NextResponse.json(
      {
        error: `Unknown templateId "${templateId}".`,
        hint: 'Check the available templates and try again.',
      },
      { status: 404 },
    );
  }

  // Create runtime template payload
  // Ensure optional properties are conditionally included (for exactOptionalPropertyTypes)
  const brandSlot: { name: string; logoUrl?: string | null } = {
    name: slots.brand.name,
  };
  if (slots.brand.logoUrl !== undefined) {
    brandSlot.logoUrl = slots.brand.logoUrl ?? null;
  }

  const docSlot: { title: string; date: string; subtitle?: string } = {
    title: slots.doc.title,
    date: slots.doc.date,
  };
  if (slots.doc.subtitle) {
    docSlot.subtitle = slots.doc.subtitle;
  }

  const customerSlot: { name: string; address?: string; taxId?: string } = {
    name: slots.customer.name,
  };
  if (slots.customer.address) {
    customerSlot.address = slots.customer.address;
  }
  if (slots.customer.taxId) {
    customerSlot.taxId = slots.customer.taxId;
  }

  // Process items to conditionally include optional note property
  const processedItems = slots.items.map((item) => {
    const processedItem: {
      name: string;
      qty: number;
      unitPrice: number;
      total: number;
      note?: string;
    } = {
      name: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      total: item.total,
    };
    if (item.note) {
      processedItem.note = item.note;
    }
    return processedItem;
  });

  const runtimeTemplate = {
    templateId,
    locale: locale ?? null,
    brand: {
      name: brand.name,
      logoUrl: brand.logoUrl ?? null,
      primaryHex: brand.primaryHex,
      secondaryHex: brand.secondaryHex,
    },
    slots: {
      brand: brandSlot,
      doc: docSlot,
      customer: customerSlot,
      items: processedItems,
      totals: slots.totals,
      ...(slots.notes && { notes: slots.notes }),
    },
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
        message:
          'PDF generation job created successfully. Use the statusUrl to check job status, or wait for webhook callback if callbackUrl was provided.',
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
