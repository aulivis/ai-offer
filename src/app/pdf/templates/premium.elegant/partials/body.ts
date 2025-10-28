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

function createStyleAttribute(tokens: RenderCtx['tokens']): string {
  const primary = tokens['color.primary'] ?? '#0f172a';
  const primaryContrast = tokens['color.primary-contrast'] ?? '#ffffff';
  const secondary = tokens['color.secondary'] ?? '#f3f4f6';
  const secondaryBorder = tokens['color.secondary-border'] ?? '#d1d5db';
  const secondaryText = tokens['color.secondary-text'] ?? '#1f2937';

  return (
    [
      `--brand-primary: ${primary}`,
      `--brand-primary-contrast: ${primaryContrast}`,
      `--brand-secondary: ${secondary}`,
      `--brand-secondary-border: ${secondaryBorder}`,
      `--brand-secondary-text: ${secondaryText}`,
    ].join('; ') + ';'
  );
}

export function renderBody(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows);
  const safeCompany = sanitizeInput(ctx.offer.companyName || '');
  const safeTitle = sanitizeInput(ctx.offer.title || 'Árajánlat');
  const logoUrl = sanitizeLogoUrl(ctx.branding?.logoUrl ?? null);
  const styleAttr = createStyleAttribute(ctx.tokens);
  const logoSlot = logoUrl
    ? `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--filled"><img class="offer-doc__logo offer-doc__logo--premium" src="${sanitizeInput(logoUrl)}" alt="Cég logó" /></div>`
    : '<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--empty"></div>';

  return `
    <main class="offer-template offer-template--premium">
      <article class="offer-doc offer-doc--premium" style="${styleAttr}">
        <header class="offer-doc__header offer-doc__header--premium">
          <div class="offer-doc__premium-banner">
            ${logoSlot}
            <div class="offer-doc__premium-text">
              <div class="offer-doc__company offer-doc__company--premium">${safeCompany || 'Vállalat neve'}</div>
              <h1 class="offer-doc__title offer-doc__title--premium">${safeTitle}</h1>
            </div>
          </div>
        </header>
        <div class="offer-doc__premium-body">
          <section class="offer-doc__content offer-doc__content--card">
            ${ctx.offer.bodyHtml}
          </section>
          <section class="offer-doc__table offer-doc__table--card">
            ${priceTable}
          </section>
        </div>
      </article>
    </main>
  `;
}
