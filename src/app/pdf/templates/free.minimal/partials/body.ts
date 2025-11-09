import { countRenderablePricingRows, priceTableHtml } from '@/app/lib/pricing';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { ensureSafeHtml } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { buildHeaderFooterCtx } from '../../shared/headerFooter';
import { renderSlimHeader, renderSlimFooter } from '../../shared/slimHeaderFooter';
import { renderMarketingFooter } from '../../shared/marketingFooter';

function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, companyPlaceholder, issueDate, labels } = safeCtx;

  return `
    <header class="offer-doc__header--minimal first-page-only">
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
    footnote: ctx.offer.pricingFootnote ?? null,
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

  // For placeholder fields, show "-" (em dash) instead of placeholder text for better UX
  const notProvided = ctx.i18n.t('pdf.templates.common.notProvided') || '—';

  const contactValue = contactName.isPlaceholder ? notProvided : contactName.value;
  const contactClass = contactName.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  const emailValue = contactEmail.isPlaceholder ? notProvided : contactEmail.value;
  const emailClass = contactEmail.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  const phoneValue = contactPhone.isPlaceholder ? notProvided : contactPhone.value;
  const phoneClass = contactPhone.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  const websiteValue = companyWebsite.isPlaceholder ? notProvided : companyWebsite.value;
  const websiteClass = companyWebsite.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  const addressValue = companyAddress.isPlaceholder ? notProvided : companyAddress.value;
  const addressClass = companyAddress.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  const taxValue = companyTaxId.isPlaceholder ? notProvided : companyTaxId.value;
  const taxClass = companyTaxId.isPlaceholder
    ? 'offer-doc__footer-value--minimal offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--minimal';

  // Add first-page-only class to ensure footer only appears on first page
  // This ensures consistency - slimFooter appears on all pages, partialFooter only on first page
  return `
    <footer class="offer-doc__footer--minimal first-page-footer">
      <div class="offer-doc__footer-grid--minimal">
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.contact}</span>
          <span class="${contactClass}">${contactValue}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.email}</span>
          <span class="${emailClass}">${emailValue}</span>
          <span class="offer-doc__footer-label--minimal offer-doc__footer-label--spaced">${labels.phone}</span>
          <span class="${phoneClass}">${phoneValue}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.website}</span>
          <span class="${websiteClass}">${websiteValue}</span>
        </div>
        <div class="offer-doc__footer-column--minimal">
          <span class="offer-doc__footer-label--minimal">${labels.company}</span>
          <span class="offer-doc__footer-label--minimal offer-doc__footer-label--spaced">${labels.address}</span>
          <span class="${addressClass}">${addressValue}</span>
          <span class="offer-doc__footer-label--minimal offer-doc__footer-label--spaced">${labels.taxId}</span>
          <span class="${taxClass}">${taxValue}</span>
        </div>
      </div>
    </footer>
  `;
}

export function renderBody(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  // Slim header should only appear on pages 2+ (hidden on page 1)
  // Slim footer appears on all pages
  const slimHeader = renderSlimHeader(safeCtx);
  const slimFooter = renderSlimFooter(safeCtx);
  const header = partialHeader(ctx);
  const sections = partialSections(ctx);
  const priceTable = partialPriceTable(ctx);
  const footer = partialFooter(ctx);
  const marketingFooter = renderMarketingFooter(ctx.i18n);

  // Order: main header first (so it's on page 1), then slim header/footer, then content
  // This allows CSS to hide slim header when it's on the same "visual page" as main header
  const content = [header, slimHeader, slimFooter, sections, priceTable, footer, marketingFooter]
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
