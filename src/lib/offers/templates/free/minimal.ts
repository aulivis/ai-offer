/**
 * Template: Minimal (Free)
 * Clean, modern, professional design
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl } from '../shared/utils';

export function renderMinimal(ctx: TemplateContext): string {
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
      --muted: #6b7280;
      --border: #e5e7eb;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      color: var(--text);
      background: #f9fafb;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg);
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
      color: white;
      padding: 3rem 2rem;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 8px;
    }
    .header-text h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .header-text p {
      opacity: 0.9;
      font-size: 1.125rem;
    }
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      font-size: 0.875rem;
    }
    .main {
      padding: 2rem;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: hsl(var(--primary));
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid hsl(var(--secondary));
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1rem;
      line-height: 1.8;
    }
    .body-content p { margin-bottom: 1rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: hsl(var(--primary));
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .body-content h1 { font-size: 1.75rem; border-bottom: 2px solid hsl(var(--primary)); padding-bottom: 0.5rem; }
    .body-content h2 { font-size: 1.5rem; }
    .body-content h3 { font-size: 1.25rem; }
    .body-content ul, .body-content ol { margin: 1rem 0 1rem 2rem; }
    .body-content li { margin-bottom: 0.5rem; }
    .body-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    .pricing-table th {
      background: hsl(var(--secondary));
      color: hsl(var(--primary));
      font-weight: 600;
      padding: 0.75rem;
      text-align: left;
      border-bottom: 2px solid hsl(var(--primary));
    }
    .pricing-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .pricing-table tbody tr:hover { background: hsl(var(--secondary)); }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 1rem;
      padding: 1rem;
      background: hsl(var(--secondary));
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
    .total-final {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 2px solid hsl(var(--primary));
      font-size: 1.125rem;
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 0.75rem 0 0.75rem 1.5rem;
      position: relative;
      margin-bottom: 0.5rem;
    }
    .list-section li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: hsl(var(--primary));
      font-weight: bold;
      font-size: 1.5rem;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .images-grid img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .footer {
      background: #f9fafb;
      padding: 2rem;
      border-top: 1px solid var(--border);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .footer-item {
      font-size: 0.875rem;
    }
    .footer-item strong {
      display: block;
      color: hsl(var(--primary));
      margin-bottom: 0.25rem;
    }
    .footer-item a {
      color: hsl(var(--primary));
      text-decoration: none;
    }
    .footer-item a:hover { text-decoration: underline; }
    .footer-copyright {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--muted);
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 1rem 0.5rem; }
      .header, .main, .footer { padding: 1.5rem; }
      .header-content { flex-direction: column; text-align: center; }
      .header-text h1 { font-size: 1.5rem; }
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
        ${logoUrl ? `<img src="${sanitizeInput(logoUrl)}" alt="${sanitizeInput(ctx.companyName)} logo" class="logo">` : ''}
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
