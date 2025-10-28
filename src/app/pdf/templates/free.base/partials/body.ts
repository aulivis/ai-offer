import { priceTableHtml } from '@/app/lib/pricing';
import { sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';

function sanitizeLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildSafeCtx(ctx: RenderCtx) {
  const companyPlaceholder = sanitizeInput(ctx.i18n.t('pdf.templates.common.companyPlaceholder'));
  const safeCompany = sanitizeInput(ctx.offer.companyName || '');
  const safeTitle = sanitizeInput(
    ctx.offer.title || ctx.i18n.t('pdf.templates.common.defaultTitle'),
  );
  const logoAlt = sanitizeInput(ctx.i18n.t('pdf.templates.common.logoAlt'));
  const logoUrl = sanitizeLogoUrl(ctx.branding?.logoUrl ?? null);

  return {
    safeCompany,
    safeTitle,
    companyPlaceholder,
    logoAlt,
    logoUrl,
  };
}

export function partialHeader(ctx: RenderCtx): string {
  const { safeCompany, safeTitle, companyPlaceholder, logoAlt, logoUrl } = buildSafeCtx(ctx);
  const logoMarkup = logoUrl
    ? `<img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="${logoAlt}" />`
    : '';

  return `
        <header class="offer-doc__header">
          ${logoMarkup}
          <div class="offer-doc__company">${safeCompany || companyPlaceholder}</div>
          <h1 class="offer-doc__title">${safeTitle}</h1>
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
  return `
        <section class="offer-doc__table">
          ${priceTable}
        </section>
  `;
}

export function partialGallery(ctx: RenderCtx): string {
  void ctx;
  return '';
}

export function partialFooter(ctx: RenderCtx): string {
  void ctx;
  return `
        <footer class="offer-doc__footer"></footer>
  `;
}

export function renderBody(ctx: RenderCtx): string {
  const header = partialHeader(ctx);
  const sections = partialSections(ctx);
  const priceTable = partialPriceTable(ctx);
  const gallery = partialGallery(ctx);
  const footer = partialFooter(ctx);

  const content = [header, sections, priceTable, gallery, footer].join('');

  return `
    <main class="offer-template offer-template--modern">
      <article class="offer-doc offer-doc--modern">
${content}
      </article>
    </main>
  `;
}
