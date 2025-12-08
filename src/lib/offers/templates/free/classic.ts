/**
 * Template: Classic (Free)
 * Elegant, serif typography, paper-like aesthetic
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl } from '../shared/utils';

export function renderClassic(ctx: TemplateContext): string {
  const { primaryColor, secondaryColor, logoUrl } = ctx.branding;
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const totals = calculateTotals(ctx.pricingRows);

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${primaryHsl};
      --secondary: ${secondaryHsl};
      --bg: #faf9f6;
      --text: #2c2416;
      --muted: #6b5d47;
      --border: #d4c5b0;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.8;
      color: var(--text);
      background: var(--bg);
      padding: 3rem 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid hsl(var(--primary) / 0.2);
      padding: 3rem;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid hsl(var(--primary));
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }
    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      border: 2px solid hsl(var(--primary) / 0.3);
      padding: 12px;
    }
    .header-text h1 {
      font-size: 2.5rem;
      font-weight: 400;
      color: hsl(var(--primary));
      margin-bottom: 0.5rem;
      font-style: italic;
    }
    .header-text p {
      font-size: 1.25rem;
      color: var(--muted);
    }
    .header-meta {
      font-size: 0.9rem;
      color: var(--muted);
      display: flex;
      gap: 2rem;
    }
    .main {
      margin: 2rem 0;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 400;
      color: hsl(var(--primary));
      margin: 2.5rem 0 1.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
      font-style: italic;
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1.1rem;
      line-height: 2;
      text-align: justify;
    }
    .body-content p { margin-bottom: 1.5rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: hsl(var(--primary));
      font-weight: 400;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-style: italic;
    }
    .body-content h1 { font-size: 1.75rem; }
    .body-content h2 { font-size: 1.5rem; }
    .body-content h3 { font-size: 1.25rem; }
    .body-content ul, .body-content ol { margin: 1.5rem 0 1.5rem 3rem; }
    .body-content li { margin-bottom: 0.75rem; }
    .body-content img { max-width: 100%; height: auto; margin: 2rem 0; border: 1px solid var(--border); }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
      border: 1px solid var(--border);
    }
    .pricing-table th {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      font-weight: 600;
      padding: 1rem;
      text-align: left;
      border-bottom: 2px solid hsl(var(--primary));
      font-family: 'Times New Roman', serif;
    }
    .pricing-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: hsl(var(--secondary) / 0.2);
      border: 1px solid var(--border);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 1.05rem;
    }
    .total-final {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid hsl(var(--primary));
      font-size: 1.25rem;
      font-weight: 600;
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 1rem 0 1rem 2rem;
      position: relative;
      margin-bottom: 0.75rem;
      border-left: 2px solid hsl(var(--primary) / 0.3);
      padding-left: 2rem;
    }
    .list-section li::before {
      content: '▸';
      position: absolute;
      left: 0.5rem;
      color: hsl(var(--primary));
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .images-grid img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border: 2px solid var(--border);
    }
    .footer {
      border-top: 2px solid var(--border);
      padding-top: 2rem;
      margin-top: 3rem;
      font-size: 0.95rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-item {
      line-height: 1.8;
    }
    .footer-item strong {
      display: block;
      color: hsl(var(--primary));
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .footer-item a {
      color: hsl(var(--primary));
      text-decoration: none;
    }
    .footer-item a:hover { text-decoration: underline; }
    .footer-copyright {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--muted);
      font-style: italic;
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 1.5rem 1rem; }
      .container { padding: 2rem 1.5rem; }
      .header-content { flex-direction: column; text-align: center; }
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
