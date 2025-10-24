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
  return `
    <table class="offer-doc__pricing-table">
      <thead>
        <tr>
          <th>Tétel</th>
          <th>Mennyiség</th>
          <th>Egység</th>
          <th>Egységár (HUF)</th>
          <th>ÁFA %</th>
          <th>Összesen (nettó)</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((r) => {
            const qty = r.qty ?? 0;
            const unitPrice = r.unitPrice ?? 0;
            const lineNet = qty * unitPrice;
            return `
              <tr>
                <td>${sanitizeInput(r.name || '')}</td>
                <td>${qty}</td>
                <td>${sanitizeInput(r.unit || '')}</td>
                <td>${unitPrice.toLocaleString('hu-HU')}</td>
                <td>${r.vat ?? 0}</td>
                <td>${lineNet.toLocaleString('hu-HU')}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5"><b>Nettó összesen</b></td>
          <td><b>${totals.net.toLocaleString('hu-HU')} Ft</b></td>
        </tr>
        <tr>
          <td colspan="5">ÁFA</td>
          <td>${totals.vat.toLocaleString('hu-HU')} Ft</td>
        </tr>
        <tr>
          <td colspan="5"><b>Bruttó összesen</b></td>
          <td><b>${totals.gross.toLocaleString('hu-HU')} Ft</b></td>
        </tr>
      </tfoot>
    </table>
  `;
}
