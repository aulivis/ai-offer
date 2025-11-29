/**
 * Modern 2025 Offer HTML Renderer
 *
 * Industry best practices:
 * - All styles inline (no external dependencies)
 * - Images embedded as data URLs
 * - Self-contained HTML documents
 * - Modern CSS (Grid, Flexbox, CSS Variables)
 * - Responsive and print-friendly
 * - Supports 6 distinct templates
 * - Works perfectly for shareable HTML links
 */

import type { PriceRow } from '@/app/lib/pricing';
import type { Translator } from '@/copy';
import { sanitizeHTML, sanitizeInput } from '@/lib/sanitize';
import { formatOfferIssueDate } from '@/lib/datetime';
import { resolveLocale } from '@/copy';
import { getTemplate, mapTemplateId, type TemplateContext } from './templates/index';

export interface OfferRenderData {
  title: string;
  companyName: string;
  bodyHtml: string;
  locale?: string;
  issueDate?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyWebsite?: string | null;
  companyAddress?: string | null;
  companyTaxId?: string | null;
  schedule?: string[];
  testimonials?: string[] | null;
  guarantees?: string[] | null;
  pricingRows?: PriceRow[];
  images?: Array<{ src: string; alt: string; key?: string }>;
  branding?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    logoUrl?: string | null;
  };
  templateId?: string; // Can be old format (free.minimal.html@1.0.0) or new (free.minimal)
}

/**
 * Generate a complete, self-contained HTML document for an offer
 *
 * Modern 2025 approach:
 * - All styles inline (no external dependencies)
 * - Images embedded as data URLs
 * - Self-contained HTML documents
 * - Template-based styling (6 distinct templates)
 * - Perfect for shareable HTML links
 */
export function renderOfferHtml(data: OfferRenderData, _i18n: Translator): string {
  const {
    title,
    companyName,
    bodyHtml,
    locale = 'hu',
    issueDate,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
    schedule = [],
    testimonials = null,
    guarantees = null,
    pricingRows = [],
    images = [],
    branding = {},
    templateId,
  } = data;

  // Resolve template ID (support both old and new formats)
  const resolvedTemplateId = templateId ? mapTemplateId(templateId) : 'free.minimal';
  const template = getTemplate(resolvedTemplateId);

  // Normalize branding colors with defaults
  const primaryColor = branding?.primaryColor || '#1c274c';
  const secondaryColor = branding?.secondaryColor || '#e2e8f0';
  const logoUrl = branding?.logoUrl || null;

  // Format issue date
  const formattedDate = issueDate || formatOfferIssueDate(new Date(), resolveLocale(locale));

  // Prepare template context
  const ctx: TemplateContext = {
    title: sanitizeInput(title),
    companyName: sanitizeInput(companyName),
    bodyHtml: sanitizeHTML(bodyHtml),
    locale: resolveLocale(locale),
    issueDate: sanitizeInput(formattedDate),
    contactName: contactName ? sanitizeInput(contactName) : null,
    contactEmail: contactEmail ? sanitizeInput(contactEmail) : null,
    contactPhone: contactPhone ? sanitizeInput(contactPhone) : null,
    companyWebsite: companyWebsite ? sanitizeInput(companyWebsite) : null,
    companyAddress: companyAddress ? sanitizeInput(companyAddress) : null,
    companyTaxId: companyTaxId ? sanitizeInput(companyTaxId) : null,
    schedule: schedule.map((item) => sanitizeInput(item)),
    testimonials: testimonials ? testimonials.map((item) => sanitizeInput(item)) : null,
    guarantees: guarantees ? guarantees.map((item) => sanitizeInput(item)) : null,
    pricingRows: pricingRows,
    images: images.map((img) => ({
      src: sanitizeInput(img.src),
      alt: sanitizeInput(img.alt || 'Image'),
    })),
    branding: {
      primaryColor,
      secondaryColor,
      logoUrl,
    },
  };

  // Render using the selected template
  return template.render(ctx);
}
