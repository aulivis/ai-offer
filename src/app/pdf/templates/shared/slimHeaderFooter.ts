import { sanitizeInput } from '@/lib/sanitize';

import type { HeaderFooterCtx } from './headerFooter';

export function renderSlimHeader(ctx: HeaderFooterCtx): string {
  const logoMarkup = ctx.logoUrl
    ? `<img src="${sanitizeInput(ctx.logoUrl)}" alt="Logo" style="height: 16px; max-width: 60px; object-fit: contain;" />`
    : `<span style="font-weight: 600; font-size: 0.75rem;">${ctx.monogram}</span>`;

  return `
    <div class="offer-doc__slim-bar slim-header" aria-hidden="true">
      <div style="display: flex; align-items: center; gap: 1rem;">
        ${logoMarkup}
        <span class="slim-header__company">${ctx.company.value || ctx.companyPlaceholder}</span>
        <span class="slim-header__title">${ctx.title}</span>
      </div>
      <span class="slim-header__meta">${ctx.labels.date}: ${ctx.issueDate.value}</span>
    </div>
  `;
}

export function renderSlimFooter(ctx: HeaderFooterCtx): string {
  return `
    <div class="offer-doc__slim-bar slim-footer" aria-hidden="true">
      <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.7rem;">
        <span style="font-weight: 600;">${ctx.company.value || ctx.companyPlaceholder}</span>
        ${ctx.companyAddress.value && !ctx.companyAddress.isPlaceholder ? `<span>${ctx.companyAddress.value}</span>` : ''}
        ${ctx.companyTaxId.value && !ctx.companyTaxId.isPlaceholder ? `<span>${ctx.labels.taxId}: ${ctx.companyTaxId.value}</span>` : ''}
      </div>
      <span class="slim-footer__page-number">${ctx.labels.page}</span>
    </div>
  `;
}

