import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { renderRuntimePdfHtml } from '@/lib/pdfRuntime';
import { getTemplateMeta } from '@/app/pdf/templates/registry';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';
import {
  createPdfOptions,
  toPuppeteerOptions,
  setPdfMetadata,
  type PdfMetadata,
} from '@/lib/pdfConfig';

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
  })
  .strict();

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function internalError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(req: NextRequest) {
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

  const { templateId, brand, slots } = parsed.data;

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

  let html: string;
  try {
    html = renderRuntimePdfHtml({ templateId, brand, slots });
    assertPdfEngineHtml(html, 'pdf-export');
  } catch (error) {
    if (error instanceof Error && /invalid hex color/i.test(error.message)) {
      return badRequest('One or more brand colors are invalid hex values.');
    }
    console.error('Failed to render PDF HTML', error);
    return internalError('Failed to render the requested PDF template.');
  }

  let pdfBinary: Uint8Array | Buffer;
  try {
    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      try {
        page.setDefaultNavigationTimeout(30_000);
        page.setDefaultTimeout(30_000);
        
        // Set viewport for consistent rendering
        await page.setViewport({
          width: 1200,
          height: 1600,
          deviceScaleFactor: 2,
        });

        // Set content and wait for resources to load
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30_000,
        });

        // Extract document title for metadata
        const documentTitle = slots.doc.title || 'Offer Document';

        // Create PDF metadata
        const pdfMetadata: PdfMetadata = {
          title: documentTitle,
          author: brand.name,
          subject: `Offer: ${documentTitle}`,
          keywords: `offer,${brand.name},${slots.doc.date}`,
          creator: 'AI Offer Platform',
          producer: 'AI Offer Platform',
        };

        // Set PDF metadata
        await setPdfMetadata(page, pdfMetadata);

        // Generate PDF with professional settings
        const pdfOptions = createPdfOptions(pdfMetadata);
        pdfBinary = await page.pdf(toPuppeteerOptions(pdfOptions));
      } finally {
        try {
          await page.close();
        } catch (pageError) {
          console.warn('Failed to close Puppeteer page for pdf-export route', pageError);
        }
      }
    } finally {
      try {
        await browser.close();
      } catch (browserError) {
        console.warn('Failed to close Puppeteer browser for pdf-export route', browserError);
      }
    }
  } catch (error) {
    console.error('Failed to generate PDF binary', error);
    return internalError('Failed to render PDF.');
  }

  const pdfBuffer = Buffer.isBuffer(pdfBinary) ? pdfBinary : Buffer.from(pdfBinary);

  // Generate filename from document title
  const sanitizedTitle = slots.doc.title
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 50);
  const filename = sanitizedTitle ? `${sanitizedTitle}.pdf` : 'offer.pdf';

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
