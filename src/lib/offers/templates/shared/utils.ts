/**
 * Shared Template Utilities
 *
 * Common functions used across all templates
 */

import type { PriceRow } from '@/app/lib/pricing';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * Calculate pricing totals
 */
export function calculateTotals(rows: PriceRow[]): {
  subtotal: number;
  totalVat: number;
  grossTotal: number;
} {
  let subtotal = 0;
  let totalVat = 0;

  for (const row of rows) {
    const qty = row.qty || 0;
    const unitPrice = row.unitPrice || 0;
    const vatRate = row.vat || 0;
    const rowTotal = qty * unitPrice;
    const rowVat = (rowTotal * vatRate) / 100;
    subtotal += rowTotal;
    totalVat += rowVat;
  }

  return {
    subtotal,
    totalVat,
    grossTotal: subtotal + totalVat,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, locale: string = 'hu-HU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert hex to HSL for CSS variables
 */
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generate pricing table HTML
 */
export function generatePricingTable(
  rows: PriceRow[],
  totals: ReturnType<typeof calculateTotals>,
  locale: string,
): string {
  if (rows.length === 0) return '';

  const rowsHtml = rows
    .map((row) => {
      const qty = row.qty || 0;
      const unitPrice = row.unitPrice || 0;
      const vatRate = row.vat || 0;
      const rowTotal = qty * unitPrice;

      return `
        <tr>
          <td>${sanitizeInput(row.name || '')}</td>
          <td class="text-right">${qty} ${sanitizeInput(row.unit || '')}</td>
          <td class="text-right">${formatCurrency(unitPrice, locale)}</td>
          <td class="text-right">${vatRate}%</td>
          <td class="text-right"><strong>${formatCurrency(rowTotal, locale)}</strong></td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="pricing-section">
      <h2 class="section-title">Árazás</h2>
      <div class="table-wrapper">
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Megnevezés</th>
              <th class="text-right">Mennyiség</th>
              <th class="text-right">Egységár</th>
              <th class="text-right">ÁFA</th>
              <th class="text-right">Összesen</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="pricing-total">
          <div class="total-row">
            <span>Nettó összeg:</span>
            <span>${formatCurrency(totals.subtotal, locale)}</span>
          </div>
          <div class="total-row">
            <span>ÁFA:</span>
            <span>${formatCurrency(totals.totalVat, locale)}</span>
          </div>
          <div class="total-row total-final">
            <span><strong>Végösszeg:</strong></span>
            <span><strong>${formatCurrency(totals.grossTotal, locale)}</strong></span>
          </div>
        </div>
      </div>
    </section>
  `;
}


