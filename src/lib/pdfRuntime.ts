import { BASE_STYLES } from '../app/pdf/sdk/baseStyles';
import { tokensToCssVars } from '../app/pdf/sdk/cssVars';
import type { BrandInput, DocSlots, RenderContext } from '../app/pdf/sdk/types';
import { buildTokens } from '../app/pdf/sdk/tokens';
import { getTemplateMeta } from '../app/pdf/templates/registry';
import { createTranslator } from '../copy';
import { PDF_ENGINE_META_TAG } from './pdfHtmlSignature';
import { sanitizeInput } from './sanitize';

export type RuntimePdfPayload = {
  templateId: string;
  locale?: string | null;
  brand: BrandInput;
  slots: DocSlots;
};

export function renderRuntimePdfHtml(payload: RuntimePdfPayload): string {
  const templateMeta = getTemplateMeta(payload.templateId);

  if (!templateMeta) {
    throw new Error(`Unknown PDF template: ${payload.templateId}`);
  }

  const template = templateMeta.factory();
  const tokens = buildTokens(payload.brand);
  const cssVars = tokensToCssVars(tokens);
  const translator = createTranslator(payload.locale);

  const ctx: RenderContext = {
    slots: payload.slots,
    tokens,
    i18n: translator,
  };

  const headHtml = template.renderHead(ctx);
  const bodyHtml = template.renderBody(ctx);
  const styles = `${BASE_STYLES}${cssVars}`;

  // Extract document title for metadata
  const documentTitle = payload.slots.doc.title || 'Offer Document';
  const brandName = payload.brand.name || 'Unknown Brand';
  const documentDate = payload.slots.doc.date || '';

  // Build comprehensive head with metadata (sanitized for safety)
  const safeTitle = sanitizeInput(documentTitle);
  const safeBrand = sanitizeInput(brandName);
  const safeDate = sanitizeInput(documentDate);
  const safeKeywords = `offer,${safeBrand},${safeDate}`.replace(/[^a-z0-9\s,]/gi, '');

  const metaTags = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="${safeBrand}" />
    <meta name="description" content="${safeTitle}" />
    <meta name="keywords" content="${safeKeywords}" />
    <title>${safeTitle}</title>
  `;

  return `<!DOCTYPE html><html lang="${translator.locale}"><head>${PDF_ENGINE_META_TAG}${metaTags}<style>${styles}</style>${headHtml}</head><body>${bodyHtml}</body></html>`;
}
