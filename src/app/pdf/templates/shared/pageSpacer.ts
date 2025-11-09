/**
 * Page spacer utilities for PDF templates
 * Provides spacing elements to prevent content overlap with fixed headers/footers
 */

/**
 * Creates a spacer element that appears only after the first page
 * This helps push content down on pages 2+ to account for the fixed slim header
 */
export function renderPageSpacer(): string {
  // This spacer will only be "visible" on pages 2+ due to page breaks
  // It provides the necessary space to account for the fixed slim header
  return `
    <div class="offer-doc__page-spacer" aria-hidden="true" style="height: 0; break-before: auto;"></div>
  `;
}








