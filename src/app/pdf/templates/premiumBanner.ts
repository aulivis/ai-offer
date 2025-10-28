import { OFFER_DOCUMENT_PDF_STYLES, OFFER_DOCUMENT_STYLES, offerBodyMarkup } from '@/app/lib/offerDocument';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';
import { priceTableHtml } from '@/app/lib/pricing';
import { sanitizeInput } from '@/lib/sanitize';

import type { OfferTemplate, RenderCtx } from './types';

export const premiumBannerTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'premium-banner@1.0.0',
  legacyId: 'premium-banner',
  tier: 'premium',
  label: 'Prémium szalagos',
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
      templateId: 'premium-banner',
    });

    return `
      <main class="offer-template offer-template--premium">
        ${article}
      </main>
    `;
  },
};
