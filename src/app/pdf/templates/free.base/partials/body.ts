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

export function renderBody(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows);
  const safeCompany = sanitizeInput(ctx.offer.companyName || '');
  const safeTitle = sanitizeInput(ctx.offer.title || 'Árajánlat');
  const logoUrl = sanitizeLogoUrl(ctx.branding?.logoUrl ?? null);
  const logoMarkup = logoUrl
    ? `<img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="Cég logó" />`
    : '';

  return `
    <main class="offer-template offer-template--modern">
      <article class="offer-doc offer-doc--modern">
        <header class="offer-doc__header">
          ${logoMarkup}
          <div class="offer-doc__company">${safeCompany || 'Vállalat neve'}</div>
          <h1 class="offer-doc__title">${safeTitle}</h1>
        </header>
        <section class="offer-doc__content">
          ${ctx.offer.bodyHtml}
        </section>
        <section class="offer-doc__table">
          ${priceTable}
        </section>
      </article>
    </main>
  `;
}
