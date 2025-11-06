import { BASE_STYLES } from '@/app/pdf/sdk/baseStyles';
import { tokensToCssVars } from '@/app/pdf/sdk/cssVars';
import type { OfferTemplate, RenderContext } from '@/app/pdf/sdk/types';
import { sanitizeInput } from '@/lib/sanitize';

function renderHead(ctx: RenderContext): string {
  const styles = `
    ${tokensToCssVars(ctx.tokens)}
    ${BASE_STYLES}
    main.offer{max-width:56rem;margin:0 auto;padding:3.5rem 3rem;display:flex;flex-direction:column;gap:2.5rem;background:var(--bg-canvas)}
    header.hero{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:2.5rem;border-radius:0;background:linear-gradient(135deg,var(--brand-primary),var(--primary-400));color:var(--text-onPrimary)}
    .hero__brand{display:flex;align-items:center;gap:1.25rem}
    .hero__identity{display:flex;flex-direction:column;gap:0.35rem}
    .hero__title{margin:0;font-size:2.4rem;font-weight:700}
    .hero__subtitle{margin:0;font-size:1rem;opacity:0.85}
    .hero__date{font-size:0.9rem;margin-top:0.5rem;opacity:0.8}
    .brand-card{background:#fff;color:var(--brand-secondary);padding:1rem 1.5rem;border-radius:0;box-shadow:none;display:flex;flex-direction:column;gap:0.5rem;min-width:220px;border:1px solid rgba(0,0,0,0.08)}
    .brand-card__name{font-size:1.05rem;font-weight:600;margin:0}
    .brand-card__tag{font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-default);opacity:0.6}
    .section.card{display:flex;flex-direction:column;gap:1.25rem}
    .section__title{margin:0;font-size:0.95rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--brand-secondary);opacity:0.8}
    .details-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1.5rem}
    .details-grid div{display:flex;flex-direction:column;gap:0.35rem}
    .details-grid dt{font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-default);opacity:0.6}
    .details-grid dd{margin:0;font-size:0.98rem;font-weight:500;color:var(--text-default)}
    .table tbody tr:nth-child(even){background:var(--primary-50)}
    .table tbody tr:last-child td{border-bottom:none}
    .item-name{font-weight:600;color:var(--text-default)}
    .item-note{margin-top:0.25rem;font-size:0.82rem;color:var(--text-default);opacity:0.7}
    .totals.section.card{padding:24px 28px;gap:1rem;background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.15);border-radius:8px}
    .totals__row{display:flex;justify-content:space-between;gap:2rem;font-weight:600;color:var(--text-default)}
    .totals__label{opacity:0.7;font-weight:500}
    .totals__highlight{font-size:1.15rem;color:var(--brand-secondary)}
    .notes{font-size:0.9rem;line-height:1.6;color:var(--text-default);opacity:0.85}
    @media print{main.offer{padding:2.5rem 2rem} header.hero{color:var(--text-onPrimary)}}
  `;

  return `<style>${styles}</style>`;
}

function renderBrandIdentity(ctx: RenderContext): string {
  const { name, logoUrl } = ctx.slots.brand;
  const safeName = sanitizeInput(name);

  if (logoUrl) {
    const safeLogo = sanitizeInput(logoUrl);
    return `<img class="brand-logo" src="${safeLogo}" alt="${safeName} logo" />`;
  }

  return `<div class="brand-fallback">${safeName}</div>`;
}

function renderClientDetails(ctx: RenderContext): string {
  const { customer } = ctx.slots;
  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.client'));
  const labels = {
    name: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerName')),
    address: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerAddress')),
    taxId: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.labels.customerTaxId')),
  };

  const rows = [
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

function renderItems(ctx: RenderContext): string {
  const { items, totals } = ctx.slots;
  const sectionTitle = sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.sections.pricing'));
  const tableHeaders = {
    service: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.service')),
    qty: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.quantity')),
    unitPrice: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.unitPrice')),
    total: sanitizeInput(ctx.i18n.t('pdf.templates.runtime.freeBase.table.total')),
  };

  const bodyRows = items
    .map((item) => {
      const name = sanitizeInput(item.name);
      const note = item.note ? `<div class="item-note">${sanitizeInput(item.note)}</div>` : '';
      const qty = typeof item.qty === 'number' ? item.qty : '';
      const unitPrice =
        typeof item.unitPrice === 'number' ? formatCurrency(item.unitPrice, totals.currency) : '';
      const total = formatCurrency(item.total, totals.currency);

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
    <section class="section card">
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
        <tbody>${bodyRows}</tbody>
      </table>
    </section>
  `;
}

function renderTotals(ctx: RenderContext): string {
  const { totals } = ctx.slots;
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
      highlight: true,
    },
  ];

  const content = rows
    .map((row) => {
      const value = formatCurrency(row.value, totals.currency);
      const highlightAttr = row.highlight ? ' class="totals__highlight"' : '';
      return `
        <div class="totals__row">
          <span class="totals__label">${row.label}</span>
          <span${highlightAttr}>${value}</span>
        </div>
      `;
    })
    .join('');

  return `
    <section class="card section totals">
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
  const { doc, brand } = ctx.slots;
  const title = sanitizeInput(doc.title);
  const subtitle = doc.subtitle ? sanitizeInput(doc.subtitle) : '';
  const date = sanitizeInput(doc.date);
  const brandName = sanitizeInput(brand.name);

  return `
    <main class="offer">
      <header class="hero">
        <div class="hero__brand">
          ${renderBrandIdentity(ctx)}
          <div class="hero__identity">
            <h1 class="hero__title">${title}</h1>
            ${subtitle ? `<p class="hero__subtitle">${subtitle}</p>` : ''}
            <div class="hero__date">${date}</div>
          </div>
        </div>
        <aside class="brand-card">
          <span class="brand-card__tag">${sanitizeInput('Prepared by')}</span>
          <p class="brand-card__name">${brandName}</p>
        </aside>
      </header>
      ${renderClientDetails(ctx)}
      ${renderItems(ctx)}
      ${renderTotals(ctx)}
      ${renderNotes(ctx)}
    </main>
  `;
}

export const Template_pro_nordic: OfferTemplate = {
  id: 'pro.nordic',
  name: 'Nordic Professional',
  version: '1.0.0',
  capabilities: ['gallery', 'long-items'],
  renderHead,
  renderBody,
};

export default Template_pro_nordic;
