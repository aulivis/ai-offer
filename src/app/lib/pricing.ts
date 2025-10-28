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
export function priceTableHtml(rows: PriceRow[]): string {
  const totals = summarize(rows);
  const formatNumber = (value: number) => value.toLocaleString('hu-HU');
  const formatCurrency = (value: number) => `${value.toLocaleString('hu-HU')} Ft`;

  return `
    <table class="offer-doc__pricing-table" style="width: 100%; border-collapse: collapse;">
      <colgroup>
        <col style="width: 32%;" />
        <col style="width: 12%;" />
        <col style="width: 12%;" />
        <col style="width: 16%;" />
        <col style="width: 12%;" />
        <col style="width: 16%;" />
      </colgroup>
      <thead>
        <tr style="background-color: #f1f4f8;">
          <th style="text-align: left; padding: 8px 12px;">Tétel</th>
          <th style="text-align: right; padding: 8px 12px;">Mennyiség</th>
          <th style="text-align: left; padding: 8px 12px;">Egység</th>
          <th style="text-align: right; padding: 8px 12px;">Egységár (Ft)</th>
          <th style="text-align: right; padding: 8px 12px;">ÁFA %</th>
          <th style="text-align: right; padding: 8px 12px;">Összesen (nettó)</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r, index) => {
            const qty = r.qty ?? 0;
            const unitPrice = r.unitPrice ?? 0;
            const vatPct = r.vat ?? 0;
            const lineNet = qty * unitPrice;
            const zebraStyle = index % 2 === 1 ? 'background-color: #fafbff;' : '';
            const name = sanitizeInput(r.name || '');
            const unit = sanitizeInput(r.unit || '');
            return `
              <tr style="${zebraStyle}">
                <td style="padding: 8px 12px; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</td>
                <td style="padding: 8px 12px; text-align: right;">${formatNumber(qty)}</td>
                <td style="padding: 8px 12px;">${unit}</td>
                <td style="padding: 8px 12px; text-align: right;">${formatCurrency(unitPrice)}</td>
                <td style="padding: 8px 12px; text-align: right;">${formatNumber(vatPct)}</td>
                <td style="padding: 8px 12px; text-align: right;">${formatCurrency(lineNet)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #e6efff; font-weight: 600;">
          <td style="padding: 10px 12px;" colspan="5">Nettó összesen</td>
          <td style="padding: 10px 12px; text-align: right;">${formatCurrency(totals.net)}</td>
        </tr>
        <tr style="background-color: #eef3ff; font-weight: 600;">
          <td style="padding: 10px 12px;" colspan="5">ÁFA</td>
          <td style="padding: 10px 12px; text-align: right;">${formatCurrency(totals.vat)}</td>
        </tr>
        <tr style="background-color: #dbe7ff; font-weight: 700;">
          <td style="padding: 12px 12px;" colspan="5">Bruttó összesen</td>
          <td style="padding: 12px 12px; text-align: right;">${formatCurrency(totals.gross)}</td>
        </tr>
      </tfoot>
    </table>
  `;
}
