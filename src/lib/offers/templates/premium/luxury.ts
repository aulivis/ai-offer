/**
 * Template: Luxury (Premium)
 * Elegant, sophisticated, high-end aesthetic with gold accents
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl, embedVideoLinks } from '../shared/utils';
import { generateWelcomeLine } from '../shared/welcome';

export function renderLuxury(ctx: TemplateContext): string {
  const { primaryColor, secondaryColor, logoUrl } = ctx.branding;
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const totals = calculateTotals(ctx.pricingRows);

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${primaryHsl};
      --secondary: ${secondaryHsl};
      --bg: #1a1625;
      --text: #f5f3f0;
      --muted: #a8a29e;
      --border: #3d3530;
      --gold: #d4af37;
    }
    body {
      font-family: 'Playfair Display', Georgia, serif;
      line-height: 1.8;
      color: var(--text);
      background: linear-gradient(135deg, #1a1625 0%, #2d1b3d 100%);
      padding: 3rem 2rem;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: var(--bg);
      border: 2px solid var(--gold);
      box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212, 175, 55, 0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, hsl(var(--primary)) 0%, #2d1b3d 100%);
      padding: 4rem 3rem;
      border-bottom: 3px solid var(--gold);
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 2.5rem;
      margin-bottom: 2rem;
    }
    .logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      border: 3px solid var(--gold);
      border-radius: 50%;
      padding: 16px;
      background: rgba(212, 175, 55, 0.1);
    }
    .header-text h1 {
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--gold);
      margin-bottom: 0.75rem;
      text-shadow: 0 2px 10px rgba(212, 175, 55, 0.3);
      font-style: italic;
    }
    .header-text p {
      font-size: 1.5rem;
      color: rgba(245, 243, 240, 0.9);
      font-weight: 400;
    }
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      font-size: 1rem;
      color: rgba(245, 243, 240, 0.95);
    }
    .main {
      padding: 3rem;
      background: rgba(26, 22, 37, 0.5);
    }
    .section-title {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--gold);
      margin: 3rem 0 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--gold);
      font-style: italic;
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1.125rem;
      line-height: 2;
      color: var(--text);
    }
    .body-content p { margin-bottom: 2rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: var(--gold);
      font-weight: 700;
      margin-top: 2.5rem;
      margin-bottom: 1.25rem;
      font-style: italic;
    }
    .body-content h1 { font-size: 2.25rem; border-bottom: 2px solid var(--gold); padding-bottom: 0.75rem; }
    .body-content h2 { font-size: 1.875rem; }
    .body-content h3 { font-size: 1.5rem; }
    .body-content ul, .body-content ol { margin: 2rem 0 2rem 3rem; }
    .body-content li { margin-bottom: 1rem; }
    .body-content img { max-width: 100%; height: auto; border: 2px solid var(--gold); margin: 2rem 0; border-radius: 4px; }
    .welcome-section {
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--gold);
    }
    .welcome-line {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--gold);
      margin: 0;
      font-style: italic;
      text-align: center;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
      border: 2px solid var(--gold);
    }
    .pricing-table th {
      background: var(--gold);
      color: var(--bg);
      font-weight: 700;
      padding: 1.5rem;
      text-align: left;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .pricing-table td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .pricing-table tbody tr:hover {
      background: rgba(212, 175, 55, 0.1);
    }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
      border: 2px solid var(--gold);
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      font-size: 1.125rem;
      color: var(--text);
    }
    .total-final {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 2px solid var(--gold);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--gold);
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 1.5rem 0 1.5rem 3rem;
      position: relative;
      margin-bottom: 1rem;
      border-left: 3px solid var(--gold);
      padding-left: 2rem;
    }
    .list-section li::before {
      content: '◆';
      position: absolute;
      left: 0.5rem;
      color: var(--gold);
      font-size: 0.875rem;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .images-grid img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border: 2px solid var(--gold);
    }
    .footer {
      background: rgba(26, 22, 37, 0.8);
      padding: 3rem;
      border-top: 2px solid var(--gold);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2.5rem;
      margin-bottom: 2rem;
    }
    .footer-item {
      font-size: 1rem;
      line-height: 1.9;
    }
    .footer-item strong {
      display: block;
      color: var(--gold);
      margin-bottom: 0.75rem;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .footer-item a {
      color: var(--text);
      text-decoration: none;
    }
    .footer-item a:hover { color: var(--gold); }
    .footer-copyright {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--muted);
      font-style: italic;
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 2rem 1rem; }
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
      ${(() => {
        const welcomeLine = generateWelcomeLine(
          ctx.customerName || ctx.contactName,
          ctx.formality || 'tegeződés',
          ctx.tone || 'friendly',
        );
        return welcomeLine ? `<section class="welcome-section">${welcomeLine}</section>` : '';
      })()}
      <section class="body-section">
        <div class="body-content">
          ${embedVideoLinks(ctx.bodyHtml)}
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

      ${
        ctx.testimonials && Array.isArray(ctx.testimonials) && ctx.testimonials.length > 0
          ? `
      <section class="list-section">
        <h2 class="section-title">Vásárlói visszajelzések</h2>
        <ul>
          ${ctx.testimonials.map((item) => `<li>${sanitizeInput(item)}</li>`).join('')}
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
