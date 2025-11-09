import { sanitizeInput } from '@/lib/sanitize';

import type { HeaderFooterCtx } from './headerFooter';

export function renderSlimHeader(ctx: HeaderFooterCtx): string {
  // Reduced logo size for slim header: 10px height (was 16px) to fit better in compact header
  const logoMarkup = ctx.logoUrl
    ? `<img src="${sanitizeInput(ctx.logoUrl)}" alt="Logo" class="slim-header__logo" />`
    : `<span class="slim-header__monogram">${ctx.monogram}</span>`;

  // Slim header should only appear on pages 2+ (not on first page where main header shows)
  // CSS will handle hiding it on first page using @page :first selector
  return `
    <div class="offer-doc__slim-bar slim-header" aria-hidden="true">
      <div class="slim-header__content">
        ${logoMarkup}
        <span class="slim-header__company">${ctx.company.value || ctx.companyPlaceholder}</span>
        <span class="slim-header__title">${ctx.title}</span>
      </div>
      <span class="slim-header__meta">${ctx.labels.date}: ${ctx.issueDate.value}</span>
    </div>
  `;
}

export function renderSlimFooter(ctx: HeaderFooterCtx): string {
  // Page numbers are now handled via Puppeteer's footerTemplate (server-side)
  // This fixed footer is kept for first page display but will be hidden in print mode
  // when Puppeteer templates are used
  return `
    <div class="offer-doc__slim-bar slim-footer" aria-hidden="true" data-puppeteer-footer="hidden">
      <div class="slim-footer__content">
        <span class="slim-footer__company">${ctx.company.value || ctx.companyPlaceholder}</span>
        ${ctx.companyAddress.value && !ctx.companyAddress.isPlaceholder ? `<span class="slim-footer__text">${ctx.companyAddress.value}</span>` : ''}
        ${ctx.companyTaxId.value && !ctx.companyTaxId.isPlaceholder ? `<span class="slim-footer__text">${ctx.labels.taxId}: ${ctx.companyTaxId.value}</span>` : ''}
      </div>
      <span class="slim-footer__page-number" data-page-label="${ctx.labels.page}">${ctx.labels.page}</span>
    </div>
  `;
}
