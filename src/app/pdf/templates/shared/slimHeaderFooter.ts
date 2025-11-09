import { sanitizeInput } from '@/lib/sanitize';

import type { HeaderFooterCtx } from './headerFooter';

export function renderSlimHeader(ctx: HeaderFooterCtx): string {
  // Reduced logo size for slim header: 10px height (was 16px) to fit better in compact header
  const logoMarkup = ctx.logoUrl
    ? `<img src="${sanitizeInput(ctx.logoUrl)}" alt="Logo" style="height: 10px; max-width: 40px; object-fit: contain; flex-shrink: 0;" />`
    : `<span style="font-weight: 600; font-size: 0.65rem; flex-shrink: 0;">${ctx.monogram}</span>`;

  // Slim header should only appear on pages 2+ (not on first page where main header shows)
  // CSS will handle hiding it on first page using @page :first selector
  return `
    <div class="offer-doc__slim-bar slim-header" aria-hidden="true">
      <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1; overflow: hidden;">
        ${logoMarkup}
        <span class="slim-header__company" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 40%;">${ctx.company.value || ctx.companyPlaceholder}</span>
        <span class="slim-header__title" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 60%;">${ctx.title}</span>
      </div>
      <span class="slim-header__meta" style="flex-shrink: 0; white-space: nowrap;">${ctx.labels.date}: ${ctx.issueDate.value}</span>
    </div>
  `;
}

export function renderSlimFooter(ctx: HeaderFooterCtx): string {
  // Page numbers are now handled via Puppeteer's footerTemplate (server-side)
  // This fixed footer is kept for first page display but will be hidden in print mode
  // when Puppeteer templates are used
  return `
    <div class="offer-doc__slim-bar slim-footer" aria-hidden="true" data-puppeteer-footer="hidden">
      <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.7rem; min-width: 0; flex: 1; max-width: 70%; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word;">
        <span style="font-weight: 600; word-wrap: break-word; overflow-wrap: break-word;">${ctx.company.value || ctx.companyPlaceholder}</span>
        ${ctx.companyAddress.value && !ctx.companyAddress.isPlaceholder ? `<span style="word-wrap: break-word; overflow-wrap: break-word;">${ctx.companyAddress.value}</span>` : ''}
        ${ctx.companyTaxId.value && !ctx.companyTaxId.isPlaceholder ? `<span style="word-wrap: break-word; overflow-wrap: break-word;">${ctx.labels.taxId}: ${ctx.companyTaxId.value}</span>` : ''}
      </div>
      <span class="slim-footer__page-number" style="flex-shrink: 0; white-space: nowrap;" data-page-label="${ctx.labels.page}">${ctx.labels.page}</span>
    </div>
  `;
}

