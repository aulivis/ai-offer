/**
 * Template: Minimalist (Free)
 * Ultra-clean, maximum whitespace, minimal design
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl } from '../shared/utils';

export function renderMinimalist(ctx: TemplateContext): string {
  const { primaryColor, secondaryColor, logoUrl } = ctx.branding;
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const totals = calculateTotals(ctx.pricingRows);

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${primaryHsl};
      --secondary: ${secondaryHsl};
      --bg: #ffffff;
      --text: #1a1a1a;
      --muted: #9ca3af;
      --border: #f3f4f6;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.8;
      color: var(--text);
      background: var(--bg);
      padding: 4rem 2rem;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: var(--bg);
    }
    .header {
      padding: 0 0 4rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 4rem;
    }
    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    .header-text h1 {
      font-size: 2.5rem;
      font-weight: 300;
      color: var(--text);
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .header-text p {
      font-size: 1rem;
      color: var(--muted);
      font-weight: 400;
    }
    .header-meta {
      font-size: 0.875rem;
      color: var(--muted);
      display: flex;
      gap: 3rem;
    }
    .main {
      margin: 0;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 400;
      color: var(--text);
      margin: 4rem 0 2rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1rem;
      line-height: 2;
      color: var(--text);
    }
    .body-content p { margin-bottom: 1.5rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: var(--text);
      font-weight: 300;
      margin-top: 3rem;
      margin-bottom: 1rem;
      letter-spacing: -0.01em;
    }
    .body-content h1 { font-size: 1.75rem; }
    .body-content h2 { font-size: 1.5rem; }
    .body-content h3 { font-size: 1.25rem; }
    .body-content ul, .body-content ol { margin: 2rem 0 2rem 1.5rem; }
    .body-content li { margin-bottom: 0.75rem; }
    .body-content img { max-width: 100%; height: auto; margin: 2rem 0; }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
    }
    .pricing-table th {
      color: var(--text);
      font-weight: 400;
      padding: 1rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .pricing-table td {
      padding: 1rem 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 2rem;
      padding: 2rem 0;
      border-top: 1px solid var(--border);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 1rem;
    }
    .total-final {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--text);
      font-size: 1.25rem;
      font-weight: 300;
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .list-section li:last-child { border-bottom: none; }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    .images-grid img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 4rem;
      margin-top: 4rem;
      font-size: 0.875rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .footer-item {
      line-height: 1.8;
    }
    .footer-item strong {
      display: block;
      color: var(--text);
      margin-bottom: 0.5rem;
      font-weight: 400;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .footer-item a {
      color: var(--text);
      text-decoration: none;
    }
    .footer-item a:hover { text-decoration: underline; }
    .footer-copyright {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--muted);
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 2rem 1rem; }
      .header-content { flex-direction: column; }
      .header-text h1 { font-size: 2rem; }
      .footer-grid { grid-template-columns: 1fr; }
    }
  `;

  return `<!DOCTYPE html>
<html lang="${ctx.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${sanitizeInput(ctx.title)} - ${sanitizeInput(ctx.companyName)} ajánlat">
  <title>${sanitizeInput(ctx.title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-content">
        ${logoUrl && typeof logoUrl === 'string' && logoUrl.trim() ? `<img src="${sanitizeInput(logoUrl)}" alt="${sanitizeInput(ctx.companyName)} logo" class="logo">` : ''}
        <div class="header-text">
          <h1>${sanitizeInput(ctx.title)}</h1>
          <p>${sanitizeInput(ctx.companyName)}</p>
        </div>
      </div>
      <div class="header-meta">
        ${ctx.contactName ? `<div><strong>Címzett:</strong> ${sanitizeInput(ctx.contactName)}</div>` : ''}
        <div><strong>Dátum:</strong> ${sanitizeInput(ctx.issueDate)}</div>
      </div>
    </header>

    <main class="main">
      <section class="body-section">
        <div class="body-content">
          ${ctx.bodyHtml}
        </div>
      </section>

      ${
        ctx.images.length > 0
          ? `
      <section class="images-section">
        <h2 class="section-title">Képek és referenciák</h2>
        <div class="images-grid">
          ${ctx.images.map((img) => `<img src="${sanitizeInput(img.src)}" alt="${sanitizeInput(img.alt || 'Image')}" loading="lazy">`).join('')}
        </div>
      </section>
      `
          : ''
      }

      ${generatePricingTable(ctx.pricingRows, totals, ctx.locale)}

      ${
        ctx.schedule && ctx.schedule.length > 0
          ? `
      <section class="list-section">
        <h2 class="section-title">Projekt mérföldkövek</h2>
        <ul>
          ${ctx.schedule.map((item) => `<li>${sanitizeInput(item)}</li>`).join('')}
        </ul>
      </section>
      `
          : ''
      }

      ${
        ctx.guarantees && ctx.guarantees.length > 0
          ? `
      <section class="list-section">
        <h2 class="section-title">Garanciák</h2>
        <ul>
          ${ctx.guarantees.map((item) => `<li>${sanitizeInput(item)}</li>`).join('')}
        </ul>
      </section>
      `
          : ''
      }
    </main>

    <footer class="footer">
      <div class="footer-grid">
        ${ctx.contactEmail ? `<div class="footer-item"><strong>E-mail:</strong><a href="mailto:${sanitizeInput(ctx.contactEmail)}">${sanitizeInput(ctx.contactEmail)}</a></div>` : ''}
        ${ctx.contactPhone ? `<div class="footer-item"><strong>Telefon:</strong><a href="tel:${sanitizeInput(ctx.contactPhone)}">${sanitizeInput(ctx.contactPhone)}</a></div>` : ''}
        ${ctx.companyWebsite ? `<div class="footer-item"><strong>Weboldal:</strong><a href="${sanitizeInput(ctx.companyWebsite)}" target="_blank" rel="noopener">${sanitizeInput(ctx.companyWebsite)}</a></div>` : ''}
        ${ctx.companyAddress ? `<div class="footer-item"><strong>Cím:</strong>${sanitizeInput(ctx.companyAddress)}</div>` : ''}
        ${ctx.companyTaxId ? `<div class="footer-item"><strong>Adószám:</strong>${sanitizeInput(ctx.companyTaxId)}</div>` : ''}
      </div>
      <div class="footer-copyright">
        <small>© ${new Date().getFullYear()} ${sanitizeInput(ctx.companyName)}. Minden jog fenntartva.</small>
      </div>
    </footer>
  </div>
</body>
</html>`;
}
