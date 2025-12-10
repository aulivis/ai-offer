/**
 * Template: Professional (Premium)
 * Modern, premium design with gradients and sophisticated styling
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl, embedVideoLinks } from '../shared/utils';
import { generateWelcomeLine } from '../shared/welcome';

export function renderProfessional(ctx: TemplateContext): string {
  const { primaryColor, secondaryColor, logoUrl } = ctx.branding;
  const primaryHsl = hexToHsl(primaryColor);
  const secondaryHsl = hexToHsl(secondaryColor);
  const totals = calculateTotals(ctx.pricingRows);

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${primaryHsl};
      --secondary: ${secondaryHsl};
      --bg: #0f172a;
      --text: #f8fafc;
      --muted: #94a3b8;
      --border: #334155;
      --accent: #3b82f6;
    }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      line-height: 1.7;
      color: var(--text);
      background: linear-gradient(135deg, var(--bg) 0%, #1e293b 100%);
      padding: 2rem 1rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.95);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .header {
      background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
      padding: 4rem 3rem;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      background: rgba(255,255,255,0.15);
      border-radius: 16px;
      padding: 12px;
      backdrop-filter: blur(10px);
    }
    .header-text h1 {
      font-size: 3rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.75rem;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
      letter-spacing: -0.02em;
    }
    .header-text p {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.9);
      font-weight: 500;
    }
    .header-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      font-size: 0.95rem;
      color: rgba(255,255,255,0.95);
      position: relative;
      z-index: 1;
    }
    .main {
      padding: 3rem;
      background: rgba(15, 23, 42, 0.5);
    }
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: hsl(var(--accent));
      margin: 3rem 0 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid hsl(var(--primary));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title:first-child { margin-top: 0; }
    .body-content {
      font-size: 1.125rem;
      line-height: 1.9;
      color: var(--text);
    }
    .body-content p { margin-bottom: 1.5rem; }
    .body-content h1, .body-content h2, .body-content h3 {
      color: hsl(var(--accent));
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    .body-content h1 { font-size: 2rem; border-bottom: 2px solid hsl(var(--accent)); padding-bottom: 0.5rem; }
    .body-content h2 { font-size: 1.75rem; }
    .body-content h3 { font-size: 1.5rem; }
    .body-content ul, .body-content ol { margin: 1.5rem 0 1.5rem 2rem; }
    .body-content li { margin-bottom: 0.75rem; }
    .body-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 2rem 0; border: 2px solid var(--border); }
    .welcome-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--border);
    }
    .welcome-line {
      font-size: 1.25rem;
      font-weight: 600;
      color: hsl(var(--accent));
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 12px;
      overflow: hidden;
    }
    .pricing-table th {
      background: hsl(var(--primary));
      color: white;
      font-weight: 700;
      padding: 1.25rem;
      text-align: left;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .pricing-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .pricing-table tbody tr:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    .text-right { text-align: right; }
    .pricing-total {
      margin-top: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
      border-radius: 16px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      font-size: 1.125rem;
      color: white;
    }
    .total-final {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid rgba(255,255,255,0.3);
      font-size: 1.5rem;
      font-weight: 800;
    }
    .list-section ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list-section li {
      padding: 1.25rem 0 1.25rem 2.5rem;
      position: relative;
      margin-bottom: 0.75rem;
      background: rgba(30, 41, 59, 0.3);
      border-radius: 8px;
      border-left: 4px solid hsl(var(--accent));
    }
    .list-section li::before {
      content: '✓';
      position: absolute;
      left: 0.75rem;
      color: hsl(var(--accent));
      font-weight: bold;
      font-size: 1.25rem;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .images-grid img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      border-radius: 12px;
      border: 2px solid var(--border);
      transition: transform 0.3s ease;
    }
    .images-grid img:hover {
      transform: scale(1.05);
    }
    .footer {
      background: rgba(15, 23, 42, 0.8);
      padding: 3rem;
      border-top: 1px solid var(--border);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-item {
      font-size: 0.95rem;
    }
    .footer-item strong {
      display: block;
      color: hsl(var(--accent));
      margin-bottom: 0.5rem;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
    }
    .footer-item a {
      color: var(--text);
      text-decoration: none;
    }
    .footer-item a:hover { color: hsl(var(--accent)); }
    .footer-copyright {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--muted);
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    @media (max-width: 768px) {
      body { padding: 1rem 0.5rem; }
      .header, .main, .footer { padding: 2rem 1.5rem; }
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
