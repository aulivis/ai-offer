/**
 * PDF Page Number Injection Utility
 *
 * This module provides utilities for creating Puppeteer header/footer templates
 * that include page numbers. Puppeteer's headerTemplate/footerTemplate natively
 * supports page numbers using the special classes .pageNumber and .totalPages.
 */

/**
 * Create a footer template for Puppeteer that includes page numbers
 * This uses Puppeteer's built-in support for page numbers
 */
export function createFooterTemplate(
  companyName: string,
  companyAddress: string,
  companyTaxId: string,
  pageLabel: string,
): string {
  // Puppeteer footer template with page number support
  // Special classes: .pageNumber, .totalPages
  // Styles are inline since external CSS may not apply
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #334155;
      padding: 4mm 0;
      width: 100%;
      box-sizing: border-box;
    ">
      <div style="
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 7pt;
        min-width: 0;
        flex: 1;
        max-width: 70%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      ">
        <span style="font-weight: 600; word-wrap: break-word;">${escapeHtml(companyName)}</span>
        ${companyAddress ? `<span style="word-wrap: break-word;">${escapeHtml(companyAddress)}</span>` : ''}
        ${companyTaxId ? `<span style="word-wrap: break-word;">${escapeHtml(companyTaxId)}</span>` : ''}
      </div>
      <span style="
        flex-shrink: 0;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      ">
        ${escapeHtml(pageLabel)} <span class="pageNumber"></span> / <span class="totalPages"></span>
      </span>
    </div>
  `;
}

/**
 * Create a header template for Puppeteer (for pages 2+)
 */
export function createHeaderTemplate(
  companyName: string,
  title: string,
  issueDate: string,
  dateLabel: string,
  logoUrl?: string,
): string {
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      padding: 4mm 0;
      border-bottom: 1px solid rgba(15, 23, 42, 0.12);
      width: 100%;
      box-sizing: border-box;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 6mm;
        min-width: 0;
        flex: 1;
        overflow: hidden;
      ">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="height: 10px; max-width: 40px; object-fit: contain; flex-shrink: 0;" />` : ''}
        <span style="
          font-weight: 600;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 40%;
          min-width: 0;
        ">${escapeHtml(companyName)}</span>
        <span style="
          font-weight: 600;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 60%;
          min-width: 0;
        ">${escapeHtml(title)}</span>
      </div>
      <span style="
        flex-shrink: 0;
        white-space: nowrap;
        font-size: 7.5pt;
        color: #64748b;
      ">${escapeHtml(dateLabel)}: ${escapeHtml(issueDate)}</span>
    </div>
  `;
}

function escapeHtml(text: string): string {
  // Simple HTML escaping for use in templates
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
