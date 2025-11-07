import { countRenderablePricingRows, priceTableHtml } from '@/app/lib/pricing';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { ensureSafeHtml, sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { buildHeaderFooterCtx } from '../../shared/headerFooter';
import { renderSlimHeader, renderSlimFooter } from '../../shared/slimHeaderFooter';

function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, companyPlaceholder, issueDate, labels } = safeCtx;

  return `
    <header class="offer-doc__header--minimal first-page-only" style="margin-top: 0; padding-top: 0;">
      <div class="offer-doc__header-content--minimal">
        <div class="offer-doc__company--minimal">${company.value || companyPlaceholder}</div>
        <h1 class="offer-doc__title--minimal">${title}</h1>
      </div>
      <div class="offer-doc__meta--minimal">
        <div class="offer-doc__meta-item--minimal">
          <span class="offer-doc__meta-label--minimal">${labels.date}</span>
          <span class="offer-doc__meta-value--minimal">${issueDate.value}</span>
        </div>
      </div>
    </header>
  `;
}

function partialSections(ctx: RenderCtx): string {
  if (!ctx.offer.bodyHtml || ctx.offer.bodyHtml.trim().length === 0) {
    return '';
  }

  return `
    <section class="section-card--minimal">
      <div class="offer-doc__content--minimal">
        ${ctx.offer.bodyHtml}
      </div>
    </section>
  `;
}

function partialPriceTable(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows, ctx.i18n, {
    footnote: ctx.offer.pricingFootnote,
  });
  const rowCount = countRenderablePricingRows(ctx.rows);

  if (rowCount === 0) {
    return '';
  }

  const pricingHeading = renderSectionHeading(
    ctx.i18n.t('pdf.templates.sections.pricing'),
    'pricing',
  );

  return `
    <section class="section-card--minimal">
      <h2 class="section-card__title--minimal">${pricingHeading}</h2>
      ${priceTable}
    </section>
  `;
}

function partialFooter(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const {
    labels,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
  } = safeCtx;

  const contactClass = contactName.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';
  const emailClass = contactEmail.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';
  const phoneClass = contactPhone.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';
  const websiteClass = companyWebsite.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';
  const addressClass = companyAddress.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';
  const taxClass = companyTaxId.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  return `
    <footer class="offer-doc__footer--minimal">
      <div class="offer-doc__footer-grid--minimal">
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.contact}</span>
          <span class="${contactClass}">${contactName.value}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.email}</span>
          <span class="${emailClass}">${contactEmail.value}</span>
          <span class="offer-doc__footer-label--minimal" style="margin-top: 0.75rem;">${labels.phone}</span>
          <span class="${phoneClass}">${contactPhone.value}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.website}</span>
          <span class="${websiteClass}">${companyWebsite.value}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.company}</span>
          <span class="offer-doc__footer-label--minimal" style="margin-top: 0.75rem;">${labels.address}</span>
          <span class="${addressClass}">${companyAddress.value}</span>
          <span class="offer-doc__footer-label--minimal" style="margin-top: 0.75rem;">${labels.taxId}</span>
          <span class="${taxClass}">${companyTaxId.value}</span>
        </div>
      </div>
    </footer>
  `;
}

export function renderBody(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const slimHeader = renderSlimHeader(safeCtx);
  const slimFooter = renderSlimFooter(safeCtx);
  const header = partialHeader(ctx);
  const sections = partialSections(ctx);
  const priceTable = partialPriceTable(ctx);
  const footer = partialFooter(ctx);

  const content = [slimHeader, slimFooter, header, sections, priceTable, footer]
    .filter(Boolean)
    .join('\n');

  const html = `
    <main class="offer-template offer-template--minimal">
      <article class="offer-doc offer-doc--minimal">
${content}
      </article>
    </main>
  `;
  ensureSafeHtml(html, 'free minimal template body');
  return html;
}




