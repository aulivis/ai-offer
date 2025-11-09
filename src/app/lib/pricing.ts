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

function hasRenderableContent(row: PriceRow | null | undefined): boolean {
  if (!row) {
    return false;
  }

  const hasName = typeof row.name === 'string' && row.name.trim().length > 0;
  const hasUnit = typeof row.unit === 'string' && row.unit.trim().length > 0;
  const hasQty = typeof row.qty === 'number' && Number.isFinite(row.qty);
  const hasUnitPrice = typeof row.unitPrice === 'number' && Number.isFinite(row.unitPrice);
  const hasVat = typeof row.vat === 'number' && Number.isFinite(row.vat);

  return hasName || hasUnit || hasQty || hasUnitPrice || hasVat;
}

export function countRenderablePricingRows(rows: PriceRow[]): number {
  return rows.reduce((count, row) => (hasRenderableContent(row) ? count + 1 : count), 0);
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

interface PriceTableRenderOptions {
  footnote?: string | null;
}

export function priceTableHtml(
  rows: PriceRow[],
  i18n: Translator = DEFAULT_TRANSLATOR,
  options: PriceTableRenderOptions = {},
): string {
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
  const resolvedFootnote =
    typeof options.footnote === 'string' ? sanitizeInput(options.footnote) : '';
  const hasFootnote = resolvedFootnote.trim().length > 0;

  return `
    <style>
      .pricing-table {
        display: grid;
        gap: 0.75rem;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .pricing-table__table-wrapper {
        border: 1px solid #d7dce6;
        border-radius: 18px;
        overflow: hidden;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .pricing-table__table {
        width: 100%;
        border-collapse: collapse;
      }
      .pricing-table__table,
      .pricing-table__table thead,
      .pricing-table__table tbody,
      .pricing-table__table tfoot,
      .pricing-table__table tr,
      .pricing-table__table th,
      .pricing-table__table td {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .pricing-table__header {
        background-color: #f1f4f8;
        color: #0f172a;
        font-weight: 600;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        padding: 10px 14px;
        text-align: left;
        text-transform: uppercase;
      }
      .pricing-table__header--numeric {
        text-align: right;
      }
      .pricing-table__row:nth-of-type(even) .pricing-table__cell {
        background-color: #f9fbff;
      }
      .pricing-table__cell {
        border-bottom: 1px solid #e4e8f0;
        color: #0f172a;
        font-size: 0.86rem;
        padding: 9px 14px;
        vertical-align: top;
      }
      .pricing-table__cell--numeric {
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .pricing-table__cell--description {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pricing-table__footer-cell {
        font-weight: 600;
        padding: 12px 14px;
      }
      .pricing-table__footer-cell--value {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .pricing-table__footer-row:first-of-type .pricing-table__footer-cell {
        border-top: 2px solid #b2c3ff;
      }
      .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
        background-color: #eef2ff;
      }
      .pricing-table__footnote {
        color: #1f2937;
        font-size: 0.8rem;
        line-height: 1.5;
        margin: 0;
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>
    <div class="pricing-table" data-pricing-table="true">
      <div class="pricing-table__table-wrapper">
        <table class="offer-doc__pricing-table pricing-table__table">
          <colgroup>
            <col style="width: 32%;" />
            <col style="width: 12%; min-width: 70px;" />
            <col style="width: 12%; min-width: 90px;" />
            <col style="width: 16%; min-width: 120px;" />
            <col style="width: 12%; min-width: 90px;" />
            <col style="width: 16%; min-width: 130px;" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" class="pricing-table__header">${headerItem}</th>
              <th scope="col" class="pricing-table__header pricing-table__header--numeric">${headerQuantity}</th>
              <th scope="col" class="pricing-table__header">${headerUnit}</th>
              <th scope="col" class="pricing-table__header pricing-table__header--numeric">${headerUnitPrice}</th>
              <th scope="col" class="pricing-table__header pricing-table__header--numeric">${headerVat}</th>
              <th scope="col" class="pricing-table__header pricing-table__header--numeric">${headerNet}</th>
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
                  <tr class="pricing-table__row">
                    <td class="pricing-table__cell pricing-table__cell--description" title="${name}">${name}</td>
                    <td class="pricing-table__cell pricing-table__cell--numeric">${formatNumber(qty)}</td>
                    <td class="pricing-table__cell">${unit}</td>
                    <td class="pricing-table__cell pricing-table__cell--numeric">${formatCurrency(unitPrice)}</td>
                    <td class="pricing-table__cell pricing-table__cell--numeric">${formatNumber(vatPct)} %</td>
                    <td class="pricing-table__cell pricing-table__cell--numeric">${formatCurrency(lineNet)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
          <tfoot>
            <tr class="pricing-table__footer-row">
              <td colspan="5" class="pricing-table__footer-cell">${footerNet}</td>
              <td class="pricing-table__footer-cell pricing-table__footer-cell--value">${formatCurrency(totals.net)}</td>
            </tr>
            <tr class="pricing-table__footer-row">
              <td colspan="5" class="pricing-table__footer-cell">${footerVat}</td>
              <td class="pricing-table__footer-cell pricing-table__footer-cell--value">${formatCurrency(totals.vat)}</td>
            </tr>
            <tr class="pricing-table__footer-row">
              <td colspan="5" class="pricing-table__footer-cell">${footerGross}</td>
              <td class="pricing-table__footer-cell pricing-table__footer-cell--value">${formatCurrency(totals.gross)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      ${hasFootnote ? `<p class="pricing-table__footnote">${resolvedFootnote}</p>` : ''}
    </div>
  `;
}
