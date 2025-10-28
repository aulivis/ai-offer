import { OFFER_DOCUMENT_PDF_STYLES, OFFER_DOCUMENT_STYLES, offerBodyMarkup } from '@/app/lib/offerDocument';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';
import { priceTableHtml } from '@/app/lib/pricing';
import { sanitizeInput } from '@/lib/sanitize';

import type { OfferTemplate, RenderCtx } from './types';

export const modernTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'modern@1.0.0',
  legacyId: 'modern',
  tier: 'free',
  label: 'Modern minimal',
  version: '1.0.0',
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead(ctx: RenderCtx): string {
    const safeTitle = sanitizeInput(ctx.offer.title || 'Árajánlat');
    return `
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${safeTitle}</title>
      <style>
        ${OFFER_DOCUMENT_PDF_STYLES}
        ${OFFER_DOCUMENT_STYLES}
      </style>
    `;
  },
  renderBody(ctx: RenderCtx): string {
    const priceTable = priceTableHtml(ctx.rows);
    const article = offerBodyMarkup({
      title: ctx.offer.title,
      companyName: ctx.offer.companyName,
      aiBodyHtml: ctx.offer.bodyHtml,
      priceTableHtml: priceTable,
      branding: ctx.branding,
      templateId: 'modern',
    });

    return `
      <main class="offer-template offer-template--modern">
        ${article}
      </main>
    `;
  },
};
