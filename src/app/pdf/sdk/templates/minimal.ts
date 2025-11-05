import type { OfferTemplate, RenderContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';

function renderHead(): string {
  return `
    <style>
      :root {
        color-scheme: light;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--bg-canvas);
        color: var(--text-default);
      }
      .offer {
        width: 100%;
        max-width: 48rem;
        margin: 0 auto;
        padding: 3rem 3rem 4rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .offer__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .offer__brand {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .offer__brand-name {
        font-size: 1.5rem;
        font-weight: 600;
      }
      .offer__title {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        text-align: right;
      }
      .offer__title-main {
        font-size: 2rem;
        font-weight: 600;
      }
      .offer__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.75rem;
        border-radius: 9999px;
        background: var(--brand-primary);
        color: var(--text-onPrimary);
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .offer__section {
        background: var(--bg-section);
        border: 1px solid var(--border-muted);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .offer__section-title {
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--brand-secondary);
      }
      .offer__info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 1rem 1.5rem;
        font-size: 0.9rem;
      }
      .offer__info-label {
        color: var(--text-default);
        opacity: 0.75;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .offer__info-value {
        font-weight: 500;
      }
      .offer__items table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }
      .offer__items thead {
        background: var(--brand-primary);
        color: var(--text-onPrimary);
      }
      .offer__items th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      .offer__items td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-muted);
        vertical-align: top;
      }
      .offer__item-name {
        font-weight: 600;
      }
      .offer__item-note {
        margin-top: 0.35rem;
        font-size: 0.8rem;
        opacity: 0.75;
      }
      .offer__items tbody tr:last-child td {
        border-bottom: none;
      }
      .offer__totals {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
        font-size: 1rem;
      }
      .offer__totals-row {
        display: flex;
        gap: 2rem;
        min-width: 16rem;
        justify-content: space-between;
      }
      .offer__notes {
        font-size: 0.85rem;
        line-height: 1.5;
        color: var(--text-default);
        opacity: 0.85;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .offer {
          padding: 2.5rem;
        }
        .offer__section {
          break-inside: avoid;
        }
        .offer__items thead {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;
}

function formatCurrency(value: number, currency: string) {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';

  let formatted = '';
  try {
    formatted = value.toLocaleString(undefined, { style: 'currency', currency: safeCurrency });
  } catch {
    formatted = `${value.toFixed(2)} ${safeCurrency}`;
  }

  return sanitizeInput(formatted);
}

function renderItems(ctx: RenderContext) {
  const currency = ctx.slots.totals.currency;
  const rows = ctx.slots.items
    .map((item) => {
      const name = sanitizeInput(item.name);
      const qty = sanitizeInput(String(item.qty));
      const unitPrice = formatCurrency(item.unitPrice, currency);
      const total = formatCurrency(item.total, currency);
      const note = item.note
        ? `<div class="offer__item-note">${sanitizeInput(item.note)}</div>`
        : '';
      return `
        <tr>
          <td>
            <div class="offer__item-name">${name}</div>
            ${note}
          </td>
          <td>${qty}</td>
          <td>${unitPrice}</td>
          <td>${total}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="offer__section offer__items">
      <div class="offer__section-title">Scope & Pricing</div>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function formatDate(value: string) {
  try {
    const formatted = new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return sanitizeInput(formatted);
  } catch {
    return sanitizeInput(value);
  }
}

function renderBody(ctx: RenderContext): string {
  const { slots } = ctx;
  const brandName = sanitizeInput(slots.brand.name);
  const logoUrl = slots.brand.logoUrl ? sanitizeInput(slots.brand.logoUrl) : null;
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 48px; object-fit: contain;" />`
    : '';

  const customerParts = [slots.customer.name, slots.customer.address, slots.customer.taxId]
    .map((value) => sanitizeInput(value ?? ''))
    .filter(Boolean);
  const customerLines = customerParts
    .map((value) => `<div class="offer__info-value">${value}</div>`)
    .join('');

  const totals = slots.totals;
  const currency = totals.currency;
  const currencyLabel = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
  const safeCurrencyLabel = sanitizeInput(currencyLabel);

  let totalsRows = '';
  for (const row of [
    { label: 'Net total', value: totals.net },
    { label: `VAT (${safeCurrencyLabel})`, value: totals.vat },
    { label: 'Grand total', value: totals.gross },
  ]) {
    const label = sanitizeInput(row.label);
    const value = formatCurrency(row.value, currency);
    totalsRows += `
      <div class="offer__totals-row">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  const notes = slots.notes
    ? `<div class="offer__section">
        <div class="offer__section-title">Notes</div>
        <div class="offer__notes">${sanitizeInput(slots.notes)}</div>
      </div>`
    : '';

  const docTitle = sanitizeInput(slots.doc.title);
  const docSubtitle = slots.doc.subtitle ? sanitizeInput(slots.doc.subtitle) : '';
  const docDate = formatDate(slots.doc.date);
  const customerName = sanitizeInput(slots.customer.name);

  return `
    <main class="offer">
      <header class="offer__header">
        <div class="offer__brand">
          ${logo}
          <div class="offer__brand-name">${brandName}</div>
        </div>
        <div class="offer__title">
          <span class="offer__badge">Offer</span>
          <div class="offer__title-main">${docTitle}</div>
          <div>${docSubtitle}</div>
          <div>${docDate}</div>
        </div>
      </header>

      <section class="offer__section">
        <div class="offer__section-title">Recipient</div>
        <div class="offer__info-grid">
          <div>
            <div class="offer__info-label">Company</div>
            ${customerLines}
          </div>
          <div>
            <div class="offer__info-label">Contact</div>
            <div class="offer__info-value">${customerName}</div>
          </div>
        </div>
      </section>

      ${renderItems(ctx)}

      <section class="offer__section">
        <div class="offer__section-title">Totals</div>
        <div class="offer__totals">
          ${totalsRows}
        </div>
      </section>

      ${notes}
    </main>
  `;
}

export const minimalRuntimeTemplate: OfferTemplate = {
  id: 'runtime.minimal@0.1.0',
  name: 'Minimal runtime',
  version: '0.1.0',
  renderHead,
  renderBody,
};
