import { createTranslator, type Translator } from '@/copy';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * Type representing a row in the price table.  Each row contains a
 * description (`name`), the quantity, unit of measurement, a unit
 * price in HUF, and the VAT percentage.  All numeric values should be
 * plain numbers (not strings) and VAT expressed as a percentage (e.g. 27
 * for 27%).
 */
export interface PriceRow {
  name?: string | undefined;
  qty?: number | undefined;
  unit?: string | undefined;
  unitPrice?: number | undefined;
  vat?: number | undefined;
}

/**
 * Summarize an array of price rows into net, VAT and gross totals.  This
 * function encapsulates the logic for computing totals so that the
 * calculation is defined in one place and reused across the API routes
 * and UI components.
 *
 * @param rows Array of price rows to summarise
 * @returns An object with `net`, `vat` and `gross` totals
 */
export function summarize(rows: PriceRow[]): { net: number; vat: number; gross: number } {
  let net = 0;
  let vatTotal = 0;
  rows.forEach((row) => {
    const qty = row.qty ?? 0;
    const price = row.unitPrice ?? 0;
    const vatPct = row.vat ?? 0;
    const lineNet = qty * price;
    const lineVat = lineNet * (vatPct / 100);
    net += lineNet;
    vatTotal += lineVat;
  });
  const gross = net + vatTotal;
  return { net, vat: vatTotal, gross };
}

/**
 * Generate HTML for a price table from an array of rows.  The returned
 * string contains a `<table>` element with headers, body and footer.
 * All user‑provided text values are escaped via `sanitizeInput` to
 * prevent HTML injection.  Numeric values are formatted according to
 * Hungarian locale.
 *
 * @param rows Array of price rows
 * @returns A string containing the HTML table
 */
const DEFAULT_TRANSLATOR = createTranslator('hu');

const LOCALE_MAP: Record<Translator['locale'], string> = {
  hu: 'hu-HU',
  en: 'en-US',
};

export function priceTableHtml(rows: PriceRow[], i18n: Translator = DEFAULT_TRANSLATOR): string {
  const totals = summarize(rows);
  const formatNumber = (value: number) => value.toLocaleString('hu-HU');
  const formatCurrency = (value: number) => `${formatNumber(value)} Ft`;
  const headerItem = sanitizeInput(i18n.t('pdf.pricingTable.headers.item'));
  const headerQuantity = sanitizeInput(i18n.t('pdf.pricingTable.headers.quantity'));
  const headerUnit = sanitizeInput(i18n.t('pdf.pricingTable.headers.unit'));
  const headerUnitPrice = sanitizeInput(i18n.t('pdf.pricingTable.headers.unitPrice'));
  const headerVat = sanitizeInput(i18n.t('pdf.pricingTable.headers.vat'));
  const headerNet = sanitizeInput(i18n.t('pdf.pricingTable.headers.netTotal'));
  const footerNet = sanitizeInput(i18n.t('pdf.pricingTable.footer.net'));
  const footerVat = sanitizeInput(i18n.t('pdf.pricingTable.footer.vat'));
  const footerGross = sanitizeInput(i18n.t('pdf.pricingTable.footer.gross'));

  return `
    <style>
      .offer-doc__pricing-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #d7dce6;
      }
      .offer-doc__pricing-table th,
      .offer-doc__pricing-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #e4e8f0;
      }
      .offer-doc__pricing-table thead th {
        background-color: #f1f4f8;
        text-align: left;
      }
      .offer-doc__pricing-table tbody tr:nth-child(even) {
        background-color: #f9fbff;
      }
      .offer-doc__pricing-table tbody td:nth-child(2),
      .offer-doc__pricing-table tbody td:nth-child(4),
      .offer-doc__pricing-table tbody td:nth-child(5),
      .offer-doc__pricing-table tbody td:nth-child(6),
      .offer-doc__pricing-table thead th:nth-child(2),
      .offer-doc__pricing-table thead th:nth-child(4),
      .offer-doc__pricing-table thead th:nth-child(5),
      .offer-doc__pricing-table thead th:nth-child(6),
      .offer-doc__pricing-table tfoot td:last-child {
        text-align: right;
      }
      .offer-doc__pricing-table tfoot tr {
        background-color: #eef2ff;
        font-weight: 600;
      }
      .offer-doc__pricing-table tfoot tr:first-child td {
        border-top: 2px solid #b2c3ff;
      }
      .offer-doc__pricing-table tfoot tr:last-child {
        font-weight: 700;
      }
    </style>
    <table class="offer-doc__pricing-table">
      <colgroup>
        <col style="width: 32%;" />
        <col style="width: 12%; min-width: 60px;" />
        <col style="width: 12%; min-width: 80px;" />
        <col style="width: 16%; min-width: 110px;" />
        <col style="width: 12%; min-width: 80px;" />
        <col style="width: 16%;" />
      </colgroup>
      <thead>
        <tr>
          <th>${headerItem}</th>
          <th>${headerQuantity}</th>
          <th style="text-align: left;">${headerUnit}</th>
          <th>${headerUnitPrice}</th>
          <th>${headerVat}</th>
          <th>${headerNet}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            const qty = r.qty ?? 0;
            const unitPrice = r.unitPrice ?? 0;
            const vatPct = r.vat ?? 0;
            const lineNet = qty * unitPrice;
            const name = sanitizeInput(r.name || '');
            const unit = sanitizeInput(r.unit || '');
            return `
              <tr>
                <td style="max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</td>
                <td>${formatNumber(qty)}</td>
                <td style="text-align: left;">${unit}</td>
                <td>${formatCurrency(unitPrice)}</td>
                <td>${formatNumber(vatPct)} %</td>
                <td>${formatCurrency(lineNet)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5">${footerNet}</td>
          <td>${formatCurrency(totals.net)}</td>
        </tr>
        <tr>
          <td colspan="5">${footerVat}</td>
          <td>${formatCurrency(totals.vat)}</td>
        </tr>
        <tr>
          <td colspan="5">${footerGross}</td>
          <td>${formatCurrency(totals.gross)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}
