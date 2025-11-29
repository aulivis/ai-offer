import type { BrandInput, DocSlots } from '../app/pdf/sdk/types';
import { createTranslator } from '../copy';
import { renderOfferHtml, type OfferRenderData } from './offers/renderer';
import { mapTemplateId } from './offers/templates/index';
import type { PriceRow } from '@/app/lib/pricing';

export type RuntimePdfPayload = {
  templateId: string;
  locale?: string | null;
  brand: BrandInput;
  slots: DocSlots;
};

/**
 * Convert PDF payload (slots structure) to HTML template data (offer structure)
 */
function convertPdfPayloadToOfferData(payload: RuntimePdfPayload): OfferRenderData {
  const { slots, brand, templateId, locale } = payload;

  // Convert items to pricing rows
  // PDF slots items already have calculated totals, so we need to derive VAT rate
  const pricingRows: PriceRow[] = slots.items.map((item) => {
    const rowTotal = item.unitPrice * item.qty;
    // Calculate VAT rate from the difference between item.total and rowTotal
    // If item.total includes VAT: VAT = item.total - rowTotal, rate = (VAT / rowTotal) * 100
    const vatAmount = item.total - rowTotal;
    const vatRate = rowTotal > 0 ? (vatAmount / rowTotal) * 100 : 0;

    return {
      name: item.name,
      qty: item.qty,
      unit: '', // PDF slots don't have unit, use empty string
      unitPrice: item.unitPrice,
      vat: Math.max(0, Math.min(100, vatRate)), // Clamp between 0-100%
    };
  });

  // Map template ID from PDF format to HTML format
  const htmlTemplateId = mapTemplateId(templateId);

  return {
    title: slots.doc.title || 'Offer Document',
    companyName: slots.brand.name || brand.name || 'Company',
    bodyHtml: slots.notes || '<p>Offer content</p>',
    locale: locale || 'hu',
    issueDate: slots.doc.date,
    contactName: slots.customer.name || null,
    contactEmail: null,
    contactPhone: null,
    companyWebsite: null,
    companyAddress: slots.customer.address || null,
    companyTaxId: slots.customer.taxId || null,
    schedule: [],
    testimonials: null,
    guarantees: null,
    pricingRows,
    images: [],
    branding: {
      primaryColor: brand.primaryHex || '#1c274c',
      secondaryColor: brand.secondaryHex || '#e2e8f0',
      logoUrl: brand.logoUrl || slots.brand.logoUrl || null,
    },
    templateId: htmlTemplateId,
  };
}

/**
 * Render HTML for PDF generation using the unified HTML template system
 *
 * This replaces the old PDF template system. HTML is generated first,
 * then converted to PDF via Puppeteer.
 */
export function renderRuntimePdfHtml(payload: RuntimePdfPayload): string {
  const translator = createTranslator(payload.locale);
  const offerData = convertPdfPayloadToOfferData(payload);

  // Use the unified HTML template system
  return renderOfferHtml(offerData, translator);
}
