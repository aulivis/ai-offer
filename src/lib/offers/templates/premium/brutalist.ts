/**
 * Template: Brutalist (Premium)
 * Bold, geometric, strong typography, high contrast
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl } from '../shared/utils';

export function renderBrutalist(ctx: TemplateContext): string {
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
      --text: #000000;
      --muted: #666666;
      --border: #000000;
    }
    body {
      font-family: 'Courier New', monospace;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
      padding: 2rem 1rem;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: var(--bg);
      border: 8px solid var(--border);
      box-shadow: 12px 12px 0 rgba(0,0,0,0.2);
    }
    .header {
      background: hsl(var(--primary));
      color: var(--bg);
      padding: 3rem 2rem;
      border-bottom: 8px solid var(--border);
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      border: 6px solid var(--border);
      background: var(--bg);
      padding: 8px;
    }
    .header-text h1 {
      font-size: 4rem;
      font-weight: 900;
      color: var(--bg);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      line-height: 1;
    }
    .header-text p {
      font-size: 1.5rem;
      color: var(--bg);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      font-size: 1rem;
      color: var(--bg);
      font-weight: 700;
      text-transform: uppercase;
    }
    .main {
      padding: 3rem 2rem;
      background: var(--bg);
    }
    .section-title {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--text);
      margin: 3rem 0 1.5rem;
      padding: 1rem;
      background: hsl(var(--secondary));
      border: 4px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1.125rem;
      line-height: 1.8;
      color: var(--text);
      font-weight: 400;
    }
    .body-content p { margin-bottom: 1.5rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: var(--text);
      font-weight: 900;
      margin-top: 2rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .body-content h1 { font-size: 2.5rem; border: 4px solid var(--border); padding: 1rem; background: hsl(var(--secondary)); }
    .body-content h2 { font-size: 2rem; border-bottom: 4px solid var(--border); padding-bottom: 0.5rem; }
    .body-content h3 { font-size: 1.5rem; }
    .body-content ul, .body-content ol { margin: 2rem 0 2rem 2rem; }
    .body-content li { margin-bottom: 1rem; font-weight: 600; }
    .body-content img { max-width: 100%; height: auto; border: 6px solid var(--border); margin: 2rem 0; }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
      border: 4px solid var(--border);
    }
    .pricing-table th {
      background: hsl(var(--primary));
      color: var(--bg);
      font-weight: 900;
      padding: 1.5rem 1rem;
      text-align: left;
      border: 2px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.875rem;
    }
    .pricing-table td {
      padding: 1.25rem 1rem;
      border: 2px solid var(--border);
      font-weight: 600;
    }
    .pricing-table tbody tr:nth-child(even) {
      background: hsl(var(--secondary));
    }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 2rem;
      padding: 2rem;
      background: hsl(var(--primary));
      color: var(--bg);
      border: 6px solid var(--border);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
    .total-final {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 4px solid var(--bg);
      font-size: 2rem;
      font-weight: 900;
      text-transform: uppercase;
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 1.5rem;
      margin-bottom: 1rem;
      border: 4px solid var(--border);
      background: hsl(var(--secondary));
      font-weight: 700;
      text-transform: uppercase;
      position: relative;
    }
    .list-section li::before {
      content: '■';
      position: absolute;
      left: 0.5rem;
      color: hsl(var(--primary));
      font-size: 1.5rem;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .images-grid img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border: 6px solid var(--border);
    }
    .footer {
      background: hsl(var(--secondary));
      padding: 3rem 2rem;
      border-top: 8px solid var(--border);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-item {
      font-size: 1rem;
      font-weight: 700;
    }
    .footer-item strong {
      display: block;
      color: var(--text);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.875rem;
    }
    .footer-item a {
      color: var(--text);
      text-decoration: none;
      border-bottom: 2px solid var(--border);
    }
    .footer-item a:hover { background: var(--text); color: var(--bg); }
    .footer-copyright {
      text-align: center;
      padding-top: 2rem;
      border-top: 4px solid var(--border);
      font-size: 0.875rem;
      color: var(--text);
      font-weight: 700;
      text-transform: uppercase;
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 1rem 0.5rem; }
      .header, .main, .footer { padding: 2rem 1.5rem; }
      .header-text h1 { font-size: 2.5rem; }
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
