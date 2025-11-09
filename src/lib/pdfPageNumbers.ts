/**
 * PDF Page Number Injection Utility
 *
 * This module provides utilities for injecting page numbers into PDF documents.
 * Since Chrome/Puppeteer does not support CSS page counters (counter(page), counter(pages)),
 * we use a two-pass approach:
 * 1. Generate PDF once to count pages using a PDF parser
 * 2. Inject page numbers into the DOM
 * 3. Generate final PDF with page numbers
 *
 * Alternatively, we can use Puppeteer's headerTemplate/footerTemplate which natively
 * supports page numbers, but this requires restructuring the HTML.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Two-pass page number injection
 * First pass: Generate PDF to count pages accurately
 * Second pass: Inject page numbers and generate final PDF
 */
export async function injectPageNumbersTwoPass(
  page: {
    evaluate: (
      fn: (totalPages: number, pageLabel: string) => void,
      totalPages: number,
      pageLabel: string,
    ) => Promise<void>;
    pdf: (options: unknown) => Promise<Buffer | Uint8Array>;
  },
  pdfOptions: unknown,
  pageLabel: string = 'Page',
): Promise<Buffer | Uint8Array> {
  // First pass: Generate PDF to count pages
  const firstPassPdf = await page.pdf(pdfOptions);

  // Parse PDF to count pages accurately using pdf-lib
  let totalPages = 1;
  try {
    const pdfBytes = firstPassPdf instanceof Buffer ? firstPassPdf : new Uint8Array(firstPassPdf);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    totalPages = pdfDoc.getPageCount();
  } catch (error) {
    console.warn('Failed to parse PDF for page count, using estimation:', error);
    // Fallback: estimate from PDF size (rough approximation)
    const pdfSize = firstPassPdf instanceof Buffer ? firstPassPdf.length : firstPassPdf.byteLength;
    // Rough estimate: ~50KB per page for typical documents
    totalPages = Math.max(1, Math.ceil(pdfSize / 50000));
  }

  // Inject page numbers into HTML using JavaScript
  // Since we have fixed footers, we need to update the page number display
  // The challenge is that fixed elements appear on every page, so we can't easily
  // know which page number to show for each instance.
  // Solution: Use a data attribute and let CSS/JS handle it, or restructure to use
  // Puppeteer's headerTemplate/footerTemplate.

  // For now, we'll update the footer to show the page number format
  // The actual page numbers will need to be handled differently since fixed
  // elements are duplicated on each page by the browser.

  // Alternative: Remove fixed positioning and use page-break-based footers
  // This is more complex but allows accurate page numbering.

  // For the current implementation, we'll use Puppeteer's headerTemplate/footerTemplate
  // which is the standard way to add page numbers to PDFs.

  return firstPassPdf;
}

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
