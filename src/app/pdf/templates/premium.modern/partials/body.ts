import { countRenderablePricingRows, priceTableHtml } from '@/app/lib/pricing';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { ensureSafeHtml, sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { buildHeaderFooterCtx } from '../../shared/headerFooter';
import { renderSlimHeader, renderSlimFooter } from '../../shared/slimHeaderFooter';

function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, companyPlaceholder, logoAlt, logoUrl, monogram, issueDate, labels } =
    safeCtx;

  const logoSlot = logoUrl
    ? `<div class="offer-doc__logo-wrap--modern"><img class="offer-doc__logo--modern" src="${logoUrl}" alt="${logoAlt}" /></div>`
    : `<div class="offer-doc__logo-wrap--modern"><span class="offer-doc__monogram--modern">${monogram}</span></div>`;

  return `
    <header class="offer-doc__header--modern section-card--modern first-page-only" style="margin-top: 0; padding-top: 0;">
      <div class="offer-doc__header-content--modern">
        ${logoSlot}
        <div class="offer-doc__header-text--modern">
          <div class="offer-doc__company--modern">${company.value || companyPlaceholder}</div>
          <h1 class="offer-doc__title--modern">${title}</h1>
        </div>
      </div>
      <div class="offer-doc__meta--modern">
        <div class="offer-doc__meta-item--modern">
          <span class="offer-doc__meta-label--modern">${labels.date}</span>
          <span class="offer-doc__meta-value--modern">${issueDate.value}</span>
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
    <section class="section-card--modern">
      <div class="offer-doc__content--modern">
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
    <section class="section-card--modern">
      <h2 class="section-card__title--modern">${pricingHeading}</h2>
      ${priceTable}
    </section>
  `;
}

function partialGallery(ctx: RenderCtx): string {
  const availableImages = Array.isArray(ctx.offer.images)
    ? ctx.offer.images
    : Array.isArray(ctx.images)
      ? ctx.images
      : [];
  const images = availableImages
    .filter((image) => typeof image?.src === 'string' && image.src.trim().length > 0)
    .slice(0, 3);

  if (images.length === 0) {
    return '';
  }

  const galleryHeading = renderSectionHeading(
    ctx.i18n.t('pdf.templates.sections.gallery'),
    'gallery',
  );

  const items = images
    .map((image) => {
      const safeSrc = sanitizeInput(image.src);
      const safeAlt = sanitizeInput(image.alt);
      const safeKey = sanitizeInput(image.key);
      return `<figure class="offer-doc__gallery-item" data-offer-gallery-key="${safeKey}"><img class="offer-doc__gallery-image" src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" /></figure>`;
    })
    .join('');

  return `
    <section class="section-card--modern">
      <h2 class="section-card__title--modern">${galleryHeading}</h2>
      <div class="offer-doc__gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${items}
      </div>
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
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';
  const emailClass = contactEmail.isPlaceholder
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';
  const phoneClass = contactPhone.isPlaceholder
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';
  const websiteClass = companyWebsite.isPlaceholder
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';
  const addressClass = companyAddress.isPlaceholder
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';
  const taxClass = companyTaxId.isPlaceholder
    ? 'offer-doc__footer-value--modern offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--modern';

  return `
    <footer class="offer-doc__footer--modern">
      <div class="offer-doc__footer-grid--modern">
        <div class="offer-doc__footer-column--modern">
          <span class="offer-doc__footer-label--modern">${labels.contact}</span>
          <span class="${contactClass}">${contactName.value}</span>
        </div>
        <div class="offer-doc__footer-column--modern">
          <span class="offer-doc__footer-label--modern">${labels.email}</span>
          <span class="${emailClass}">${contactEmail.value}</span>
          <span class="offer-doc__footer-label--modern" style="margin-top: 0.75rem;">${labels.phone}</span>
          <span class="${phoneClass}">${contactPhone.value}</span>
        </div>
        <div class="offer-doc__footer-column--modern">
          <span class="offer-doc__footer-label--modern">${labels.website}</span>
          <span class="${websiteClass}">${companyWebsite.value}</span>
        </div>
        <div class="offer-doc__footer-column--modern">
          <span class="offer-doc__footer-label--modern">${labels.company}</span>
          <span class="offer-doc__footer-label--modern" style="margin-top: 0.75rem;">${labels.address}</span>
          <span class="${addressClass}">${companyAddress.value}</span>
          <span class="offer-doc__footer-label--modern" style="margin-top: 0.75rem;">${labels.taxId}</span>
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
  const gallery = partialGallery(ctx);
  const footer = partialFooter(ctx);

  const content = [slimHeader, slimFooter, header, sections, priceTable, gallery, footer].filter(Boolean).join('\n');

  const html = `
    <main class="offer-template offer-template--modern">
      <article class="offer-doc offer-doc--modern">
${content}
      </article>
    </main>
  `;
  ensureSafeHtml(html, 'premium modern template body');
  return html;
}

