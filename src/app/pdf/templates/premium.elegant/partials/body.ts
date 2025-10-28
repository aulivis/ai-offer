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
  const safeCompany = sanitizeInput(ctx.offer.companyName || '');
  const safeTitle = sanitizeInput(ctx.offer.title || 'Árajánlat');
  const logoUrl = sanitizeLogoUrl(ctx.branding?.logoUrl ?? null);

  return {
    safeCompany,
    safeTitle,
    logoUrl,
  };
}

export function partialHeader(ctx: RenderCtx): string {
  const { safeCompany, safeTitle, logoUrl } = buildSafeCtx(ctx);
  const logoSlot = logoUrl
    ? `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--filled"><img class="offer-doc__logo offer-doc__logo--premium" src="${sanitizeInput(logoUrl)}" alt="Cég logó" /></div>`
    : '<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--empty"></div>';

  return `
        <header class="offer-doc__header offer-doc__header--premium">
          <div class="offer-doc__premium-banner">
            ${logoSlot}
            <div class="offer-doc__premium-text">
              <div class="offer-doc__company offer-doc__company--premium">${safeCompany || 'Vállalat neve'}</div>
              <h1 class="offer-doc__title offer-doc__title--premium">${safeTitle}</h1>
            </div>
          </div>
        </header>
  `;
}

export function partialSections(ctx: RenderCtx): string {
  return `
        <section class="offer-doc__content offer-doc__content--card">
          ${ctx.offer.bodyHtml}
        </section>
  `;
}

export function partialPriceTable(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows);
  return `
        <section class="offer-doc__table offer-doc__table--card">
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

  const content = [
    header,
    '        <div class="offer-doc__premium-body">\n',
    sections,
    priceTable,
    '        </div>\n',
    gallery,
    footer,
  ].join('');

  return `
    <main class="offer-template offer-template--premium">
      <article class="offer-doc offer-doc--premium">
${content}
      </article>
    </main>
  `;
}
