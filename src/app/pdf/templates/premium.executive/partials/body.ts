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
    ? `<div class="offer-doc__logo-wrap--executive"><img class="offer-doc__logo--executive" src="${logoUrl}" alt="${logoAlt}" /></div>`
    : `<div class="offer-doc__logo-wrap--executive"><span class="offer-doc__monogram--executive">${monogram}</span></div>`;

  return `
    <header class="offer-doc__header--executive first-page-only" style="margin-top: 0; padding-top: 0;">
      <div class="offer-doc__header-content--executive">
        ${logoSlot}
        <div class="offer-doc__header-text--executive">
          <div class="offer-doc__company--executive">${company.value || companyPlaceholder}</div>
          <h1 class="offer-doc__title--executive">${title}</h1>
        </div>
      </div>
      <div class="offer-doc__meta--executive">
        <div class="offer-doc__meta-item--executive">
          <span class="offer-doc__meta-label--executive">${labels.date}</span>
          <span class="offer-doc__meta-value--executive">${issueDate.value}</span>
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
    <section class="section-card--executive">
      <div class="offer-doc__content--executive">
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
    <section class="section-card--executive">
      <h2 class="section-card__title--executive">${pricingHeading}</h2>
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
      return `<figure class="offer-doc__gallery-item--executive" data-offer-gallery-key="${safeKey}"><img class="offer-doc__gallery-image--executive" src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" /></figure>`;
    })
    .join('');

  return `
    <section class="section-card--executive">
      <h2 class="section-card__title--executive">${galleryHeading}</h2>
      <div class="offer-doc__gallery--executive">
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
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';
  const emailClass = contactEmail.isPlaceholder
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';
  const phoneClass = contactPhone.isPlaceholder
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';
  const websiteClass = companyWebsite.isPlaceholder
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';
  const addressClass = companyAddress.isPlaceholder
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';
  const taxClass = companyTaxId.isPlaceholder
    ? 'offer-doc__footer-value--executive offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value--executive';

  return `
    <footer class="offer-doc__footer--executive">
      <div class="offer-doc__footer-grid--executive">
        <div class="offer-doc__footer-column--executive">
          <span class="offer-doc__footer-label--executive">${labels.contact}</span>
          <span class="${contactClass}">${contactName.value}</span>
        </div>
        <div class="offer-doc__footer-column--executive">
          <span class="offer-doc__footer-label--executive">${labels.email}</span>
          <span class="${emailClass}">${contactEmail.value}</span>
          <span class="offer-doc__footer-label--executive" style="margin-top: 0.75rem;">${labels.phone}</span>
          <span class="${phoneClass}">${contactPhone.value}</span>
        </div>
        <div class="offer-doc__footer-column--executive">
          <span class="offer-doc__footer-label--executive">${labels.website}</span>
          <span class="${websiteClass}">${companyWebsite.value}</span>
        </div>
        <div class="offer-doc__footer-column--executive">
          <span class="offer-doc__footer-label--executive">${labels.company}</span>
          <span class="offer-doc__footer-label--executive" style="margin-top: 0.75rem;">${labels.address}</span>
          <span class="${addressClass}">${companyAddress.value}</span>
          <span class="offer-doc__footer-label--executive" style="margin-top: 0.75rem;">${labels.taxId}</span>
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

  const content = [slimHeader, slimFooter, header, sections, priceTable, gallery, footer]
    .filter(Boolean)
    .join('\n');

  const html = `
    <main class="offer-template offer-template--executive">
      <article class="offer-doc offer-doc--executive">
${content}
      </article>
    </main>
  `;
  ensureSafeHtml(html, 'premium executive template body');
  return html;
}

