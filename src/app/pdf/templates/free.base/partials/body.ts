import { countRenderablePricingRows, priceTableHtml } from '@/app/lib/pricing';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { ensureSafeHtml, sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { buildHeaderFooterCtx } from '../../shared/headerFooter';

export function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, companyPlaceholder, logoAlt, logoUrl, issueDate, labels, monogram } =
    safeCtx;
  const resolvedLogoMarkup = logoUrl
    ? `<div class="offer-doc__logo-wrap"><img class="offer-doc__logo" src="${logoUrl}" alt="${logoAlt}" /></div>`
    : `<div class="offer-doc__logo-wrap"><span class="offer-doc__monogram">${monogram}</span></div>`;
  const metaValueClass = issueDate.isPlaceholder
    ? 'offer-doc__meta-value offer-doc__meta-value--placeholder'
    : 'offer-doc__meta-value';

  return `
        <header class="offer-doc__header">
          <div class="offer-doc__header-brand">
            ${resolvedLogoMarkup}
            <div class="offer-doc__header-text">
              <div class="offer-doc__company">${company.value || companyPlaceholder}</div>
              <h1 class="offer-doc__title">${title}</h1>
            </div>
          </div>
          <div class="offer-doc__meta">
            <span class="offer-doc__meta-label">${labels.date}</span>
            <span class="${metaValueClass}">${issueDate.value}</span>
          </div>
        </header>
  `;
}

export function partialSections(ctx: RenderCtx): string {
  return `
        <section class="offer-doc__content">
          ${ctx.offer.bodyHtml}
        </section>
  `;
}

export function partialPriceTable(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows, ctx.i18n);
  const rowCount = countRenderablePricingRows(ctx.rows);
  const tableClasses = ['offer-doc__table'];
  if (rowCount > 0 && rowCount <= 3) {
    tableClasses.push('offer-doc__table--force-break');
  }
  const pricingHeading = renderSectionHeading(
    ctx.i18n.t('pdf.templates.sections.pricing'),
    'pricing',
  );
  return `
        <section class="${tableClasses.join(' ')}">
          ${pricingHeading}
          ${priceTable}
        </section>
  `;
}

export function partialGallery(ctx: RenderCtx): string {
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
        <section class="offer-doc__gallery offer-doc__gallery--card">
          ${galleryHeading}
          <div class="offer-doc__gallery-grid">
            ${items}
          </div>
        </section>
  `;
}

export function partialFooter(ctx: RenderCtx): string {
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
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';
  const emailClass = contactEmail.isPlaceholder
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';
  const phoneClass = contactPhone.isPlaceholder
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';
  const websiteClass = companyWebsite.isPlaceholder
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';
  const addressClass = companyAddress.isPlaceholder
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';
  const taxClass = companyTaxId.isPlaceholder
    ? 'offer-doc__footer-value offer-doc__footer-value--placeholder'
    : 'offer-doc__footer-value';

  return `
        <footer class="offer-doc__footer">
          <div class="offer-doc__footer-grid">
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${labels.contact}</span>
              <span class="${contactClass}">${contactName.value}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${labels.email}</span>
              <span class="${emailClass}">${contactEmail.value}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${labels.phone}</span>
              <span class="${phoneClass}">${contactPhone.value}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${labels.website}</span>
              <span class="${websiteClass}">${companyWebsite.value}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${labels.company}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${labels.address}</span>
              <span class="${addressClass}">${companyAddress.value}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${labels.taxId}</span>
              <span class="${taxClass}">${companyTaxId.value}</span>
            </div>
          </div>
        </footer>
  `;
}

export function renderBody(ctx: RenderCtx): string {
  const header = partialHeader(ctx);
  const sections = partialSections(ctx);
  const priceTable = partialPriceTable(ctx);
  const gallery = partialGallery(ctx);
  const footer = partialFooter(ctx);

  const content = [header, sections, priceTable, gallery, footer].join('');

  const html = `
    <main class="offer-template offer-template--modern">
      <article class="offer-doc offer-doc--modern">
${content}
      </article>
    </main>
  `;
  ensureSafeHtml(html, 'free template body');
  return html;
}
