import { BASE_STYLES } from '@/app/pdf/sdk/baseStyles';
import { tokensToCssVars } from '@/app/pdf/sdk/cssVars';
import type { OfferTemplate, RenderContext } from '@/app/pdf/sdk/types';
import { sanitizeInput } from '@/lib/sanitize';

function renderHead(ctx: RenderContext): string {
  const styles = `
    ${tokensToCssVars(ctx.tokens)}
    ${BASE_STYLES}
    main.offer{max-width:48rem;margin:0 auto;padding:3rem 2.5rem;display:flex;flex-direction:column;gap:2rem}
    header.doc-header{justify-content:space-between}
    .doc-header__info{display:flex;flex-direction:column;gap:0.25rem}
    .doc-header__title{font-size:2rem;font-weight:600;color:var(--brand-primary);margin:0}
    .doc-header__subtitle{color:var(--text-default);opacity:0.7;font-size:0.95rem}
    .doc-header__date{font-size:0.85rem;color:var(--text-default);opacity:0.6}
    .card.section{gap:1.25rem;display:flex;flex-direction:column}
    .section__title{margin:0;font-size:1rem;font-weight:600;color:var(--brand-secondary);letter-spacing:0.04em;text-transform:uppercase}
    .details-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1rem}
    .details-grid div{display:flex;flex-direction:column;gap:0.25rem}
    .details-grid dt{font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-default);opacity:0.7}
    .details-grid dd{margin:0;font-size:0.95rem;font-weight:500;color:var(--text-default)}
    .items-table .table thead th{font-weight:600;letter-spacing:0.02em;text-transform:uppercase;font-size:0.75rem}
    .items-table .table tbody tr:last-child td{border-bottom:none}
    .item-name{font-weight:600;color:var(--text-default)}
    .item-note{margin-top:0.25rem;font-size:0.8rem;color:var(--text-default);opacity:0.7}
    .totals{display:flex;flex-direction:column;gap:0.75rem;align-items:flex-end}
    .totals__row{display:flex;gap:2rem;min-width:16rem;justify-content:space-between;font-weight:600;color:var(--text-default)}
    .totals__label{opacity:0.7;font-weight:500}
    .notes{font-size:0.85rem;line-height:1.5;color:var(--text-default);opacity:0.85}
    @media print{main.offer{padding:2.5rem 2rem}}
  `;

  return `<style>${styles}</style>`;
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function renderBrand(ctx: RenderContext): string {
  const { name, logoUrl } = ctx.slots.brand;
  const safeName = sanitizeInput(name);

  if (logoUrl) {
    const safeLogo = sanitizeInput(logoUrl);
    return `<img class="brand-logo" src="${safeLogo}" alt="${safeName} logo" />`;
  }

  return `<div class="brand-fallback">${safeName}</div>`;
}

function renderCustomerDetails(ctx: RenderContext): string {
  const { customer } = ctx.slots;
  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.client'));
  const labels = {
    name: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerName')),
    address: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerAddress')),
    taxId: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerTaxId')),
  };

  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: labels.name, value: customer.name },
    { label: labels.address, value: customer.address },
    { label: labels.taxId, value: customer.taxId },
  ].filter((row) => Boolean(row.value));

  if (rows.length === 0) {
    return '';
  }

  const content = rows
    .map((row) => {
      const safeValue = sanitizeInput(row.value ?? '');
      return `<div><dt>${row.label}</dt><dd>${safeValue}</dd></div>`;
    })
    .join('');

  return `
    <section class="section card">
      <h2 class="section__title">${sectionTitle}</h2>
      <dl class="details-grid">${content}</dl>
    </section>
  `;
}

function renderItems(ctx: RenderContext): string {
  const currency = ctx.slots.totals.currency;
  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.pricing'));
  const tableHeaders = {
    service: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.service')),
    qty: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.quantity')),
    unitPrice: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.unitPrice')),
    total: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.total')),
  };
  const rows = ctx.slots.items
    .map((item) => {
      const name = sanitizeInput(item.name);
      const note = item.note ? `<div class="item-note">${sanitizeInput(item.note)}</div>` : '';
      const qty = typeof item.qty === 'number' ? item.qty : '';
      const unitPrice =
        typeof item.unitPrice === 'number' ? formatCurrency(item.unitPrice, currency) : '';
      const total = formatCurrency(item.total, currency);

      return [
        '<tr>',
        '<td>',
        `<div class="item-name">${name}</div>`,
        note,
        '</td>',
        `<td>${qty}</td>`,
        `<td>${unitPrice}</td>`,
        `<td>${total}</td>`,
        '</tr>',
      ].join('');
    })
    .join('');

  return `
    <section class="section card items-table">
      <h2 class="section__title">${sectionTitle}</h2>
      <table class="table">
        <thead>
          <tr>
            <th>${tableHeaders.service}</th>
            <th>${tableHeaders.qty}</th>
            <th>${tableHeaders.unitPrice}</th>
            <th>${tableHeaders.total}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTotals(ctx: RenderContext): string {
  const { totals } = ctx.slots;
  const currency = totals.currency;
  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.totals'));
  const rows = [
    {
      label: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.totals.subtotal')),
      value: totals.net,
    },
    {
      label: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.totals.tax')),
      value: totals.vat,
    },
    {
      label: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.totals.total')),
      value: totals.gross,
    },
  ];

  const content = rows
    .map(
      (row) => `
        <div class="totals__row">
          <span class="totals__label">${row.label}</span>
          <span>${formatCurrency(row.value, currency)}</span>
        </div>
      `,
    )
    .join('');

  return `
    <section class="section card totals">
      <h2 class="section__title">${sectionTitle}</h2>
      ${content}
    </section>
  `;
}

function renderNotes(ctx: RenderContext): string {
  if (!ctx.slots.notes) {
    return '';
  }

  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.notes'));
  const notes = sanitizeInput(ctx.slots.notes);

  return `
    <section class="section card">
      <h2 class="section__title">${sectionTitle}</h2>
      <div class="notes">${notes}</div>
    </section>
  `;
}

function renderBody(ctx: RenderContext): string {
  const { doc } = ctx.slots;
  const title = sanitizeInput(doc.title);
  const subtitle = doc.subtitle ? sanitizeInput(doc.subtitle) : '';
  const date = sanitizeInput(doc.date);

  return `
    <main class="offer">
      <header class="doc-header section card">
        ${renderBrand(ctx)}
        <div class="doc-header__info">
          <h1 class="doc-header__title">${title}</h1>
          ${subtitle ? `<div class="doc-header__subtitle">${subtitle}</div>` : ''}
          <div class="doc-header__date">${date}</div>
        </div>
      </header>
      ${renderCustomerDetails(ctx)}
      ${renderItems(ctx)}
      ${renderTotals(ctx)}
      ${renderNotes(ctx)}
    </main>
  `;
}

export const freeBaseTemplate: OfferTemplate = {
  id: 'free.base',
  name: 'Modern minimal',
  version: '2.0.0',
  capabilities: ['branding.logo', 'branding.colors', 'pricing.table'],
  renderHead,
  renderBody,
};

export default freeBaseTemplate;
