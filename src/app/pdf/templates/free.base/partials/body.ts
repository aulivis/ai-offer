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
  const logoMarkup = logoUrl
    ? `<img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="Cég logó" />`
    : '';
  const styleAttr = createStyleAttribute(ctx.tokens);

  return `
    <main class="offer-template offer-template--modern">
      <article class="offer-doc offer-doc--modern" style="${styleAttr}">
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
