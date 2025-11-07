import { sanitizeInput } from '@/lib/sanitize';

import type { HeaderFooterCtx } from './headerFooter';

export function renderSlimHeader(ctx: HeaderFooterCtx): string {
  const logoMarkup = ctx.logoUrl
    ? `<img src="${sanitizeInput(ctx.logoUrl)}" alt="Logo" style="height: 16px; max-width: 60px; object-fit: contain; flex-shrink: 0;" />`
    : `<span style="font-weight: 600; font-size: 0.75rem; flex-shrink: 0;">${ctx.monogram}</span>`;

  // Slim header should only appear on pages 2+ (not on first page where main header shows)
  // CSS will handle hiding it on first page
  return `
    <div class="offer-doc__slim-bar slim-header not-first-page" aria-hidden="true">
      <div style="display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; overflow: hidden;">
        ${logoMarkup}
        <span class="slim-header__company" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 40%;">${ctx.company.value || ctx.companyPlaceholder}</span>
        <span class="slim-header__title" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 60%;">${ctx.title}</span>
      </div>
      <span class="slim-header__meta" style="flex-shrink: 0; white-space: nowrap;">${ctx.labels.date}: ${ctx.issueDate.value}</span>
    </div>
  `;
}

export function renderSlimFooter(ctx: HeaderFooterCtx): string {
  // Page numbers are added via CSS counter in print mode
  // The label is just "Oldal" which will become "Oldal 1 / 2" etc. via CSS
  return `
    <div class="offer-doc__slim-bar slim-footer" aria-hidden="true">
      <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.7rem; min-width: 0; flex: 1; max-width: 70%; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
        <span style="font-weight: 600; word-wrap: break-word; overflow-wrap: break-word;">${ctx.company.value || ctx.companyPlaceholder}</span>
        ${ctx.companyAddress.value && !ctx.companyAddress.isPlaceholder ? `<span style="word-wrap: break-word; overflow-wrap: break-word;">${ctx.companyAddress.value}</span>` : ''}
        ${ctx.companyTaxId.value && !ctx.companyTaxId.isPlaceholder ? `<span style="word-wrap: break-word; overflow-wrap: break-word;">${ctx.labels.taxId}: ${ctx.companyTaxId.value}</span>` : ''}
      </div>
      <span class="slim-footer__page-number" style="flex-shrink: 0; white-space: nowrap;">${ctx.labels.page}</span>
    </div>
  `;
}

