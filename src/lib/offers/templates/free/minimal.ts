/**
 * Template: Minimal (Free)
 * Clean, modern, professional design
 */

import type { TemplateContext } from '../types';
import { sanitizeInput } from '@/lib/sanitize';
import { calculateTotals, generatePricingTable, hexToHsl, embedVideoLinks } from '../shared/utils';

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
    .images-grid {
      cursor: pointer;
    }
    .images-grid img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--border);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .images-grid img:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    /* Lightbox styles */
    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 10000;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      box-sizing: border-box;
    }
    .lightbox.active {
      display: flex;
    }
    .lightbox-content {
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
    }
    .lightbox-content img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .lightbox-close {
      position: absolute;
      top: -2.5rem;
      right: 0;
      background: rgba(255,255,255,0.9);
      border: none;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
      transition: background 0.2s;
    }
    .lightbox-close:hover {
      background: rgba(255,255,255,1);
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.9);
      border: none;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      transition: background 0.2s;
    }
    .lightbox-nav:hover {
      background: rgba(255,255,255,1);
    }
    .lightbox-prev {
      left: -4rem;
    }
    .lightbox-next {
      right: -4rem;
    }
    /* Video embed styles */
    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      max-width: 100%;
      margin: 1rem 0;
      border-radius: 8px;
    }
    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
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
    /* Screen reader only - accessibility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    .sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
    /* Focus styles for keyboard navigation */
    *:focus-visible {
      outline: 2px solid hsl(var(--primary));
      outline-offset: 2px;
    }
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      :root {
        --border: #000000;
        --text: #000000;
        --muted: #333333;
      }
      .header {
        border: 2px solid #ffffff;
      }
      .section-title {
        border-bottom-width: 3px;
      }
    }
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    /* Table of contents / Navigation */
    .toc-container {
      position: sticky;
      top: 1rem;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
    }
    .toc-title {
      font-size: 1rem;
      font-weight: 600;
      color: hsl(var(--primary));
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .toc-item {
      margin-bottom: 0.5rem;
    }
    .toc-link {
      color: var(--text);
      text-decoration: none;
      font-size: 0.875rem;
      padding: 0.375rem 0.5rem;
      display: block;
      border-radius: 4px;
      transition: background 0.2s, color 0.2s;
    }
    .toc-link:hover {
      background: hsl(var(--secondary));
      color: hsl(var(--primary));
    }
    .toc-link.active {
      background: hsl(var(--primary));
      color: white;
      font-weight: 500;
    }
    .toc-item.toc-level-2 {
      margin-left: 1rem;
      font-size: 0.8125rem;
    }
    .toc-item.toc-level-3 {
      margin-left: 1.5rem;
      font-size: 0.75rem;
    }
    .section-anchor {
      scroll-margin-top: 2rem;
    }
    /* Removed @media print - PDF should match web view 1-to-1 */
    /* Mobile-first responsive design */
    @media (max-width: 639px) {
      body { padding: 0.75rem 0.5rem; }
      .container { border-radius: 8px; }
      .header, .main, .footer { padding: 1rem; }
      .header-content { flex-direction: column; text-align: center; gap: 1rem; }
      .header-text h1 { font-size: 1.5rem; }
      .header-text p { font-size: 1rem; }
      .header-meta { grid-template-columns: 1fr; gap: 0.75rem; font-size: 0.8125rem; }
      .section-title { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; }
      .body-content { font-size: 0.9375rem; line-height: 1.6; }
      .body-content h1 { font-size: 1.5rem; }
      .body-content h2 { font-size: 1.25rem; }
      .body-content h3 { font-size: 1.125rem; }
      .pricing-table { font-size: 0.875rem; }
      .pricing-table th, .pricing-table td { padding: 0.5rem 0.375rem; }
      .footer-grid { grid-template-columns: 1fr; gap: 1rem; }
      .images-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
      .images-grid img { height: 140px; }
      .lightbox-content { max-width: 95vw; max-height: 95vh; }
      .lightbox-close { top: -3rem; right: -1rem; width: 2rem; height: 2rem; font-size: 1.25rem; }
      .lightbox-nav { width: 2.25rem; height: 2.25rem; font-size: 1.125rem; }
      .lightbox-prev { left: 0.5rem; }
      .lightbox-next { right: 0.5rem; }
      .video-container { margin: 0.75rem 0; }
    }
    @media (min-width: 640px) and (max-width: 767px) {
      body { padding: 1.5rem 1rem; }
      .header, .main, .footer { padding: 1.75rem; }
      .header-text h1 { font-size: 1.75rem; }
      .images-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.875rem; }
      .images-grid img { height: 160px; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .header, .main, .footer { padding: 2rem 1.5rem; }
      .images-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
    }
    @media (min-width: 1024px) {
      .images-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
      .main {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 2rem;
        align-items: start;
      }
      .main-content {
        grid-column: 2;
      }
      .toc-container {
        grid-column: 1;
        position: sticky;
        top: 1rem;
      }
    }
    @media (max-width: 1023px) {
      .toc-container {
        display: none;
      }
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
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg">Ugrás a főtartalomhoz</a>
  <!-- Lightbox for images -->
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" aria-hidden="true">
    <button class="lightbox-close" id="lightbox-close" aria-label="Bezárás">×</button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Előző kép">‹</button>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Következő kép">›</button>
    <div class="lightbox-content">
      <img id="lightbox-img" src="" alt="" role="img">
    </div>
  </div>
  <script>
    (function() {
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightbox-img');
      const lightboxClose = document.getElementById('lightbox-close');
      const lightboxPrev = document.getElementById('lightbox-prev');
      const lightboxNext = document.getElementById('lightbox-next');
      const images = Array.from(document.querySelectorAll('.images-grid img[data-lightbox-index]'));
      let currentIndex = 0;
      
      function openLightbox(index) {
        if (images.length === 0) return;
        currentIndex = index;
        const img = images[currentIndex];
        if (lightboxImg && img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt || 'Kép';
          if (lightbox) {
            lightbox.classList.add('active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
          }
        }
      }
      
      function closeLightbox() {
        if (lightbox) {
          lightbox.classList.remove('active');
          lightbox.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
      }
      
      function showNext() {
        if (images.length === 0) return;
        currentIndex = (currentIndex + 1) % images.length;
        openLightbox(currentIndex);
      }
      
      function showPrev() {
        if (images.length === 0) return;
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        openLightbox(currentIndex);
      }
      
      images.forEach((img, index) => {
        img.addEventListener('click', () => openLightbox(index));
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(index);
          }
        });
      });
      
      if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
      if (lightboxNext) lightboxNext.addEventListener('click', showNext);
      if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);
      
      if (lightbox) {
        lightbox.addEventListener('click', (e) => {
          if (e.target === lightbox) closeLightbox();
        });
      }
      
      document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
      });
    })();

    // Table of contents generation
    (function() {
      const tocList = document.getElementById('toc-list');
      if (!tocList) return;

      const sections = [
        { id: 'body-section', title: 'Ajánlat részletei', level: 1 },
        { id: 'pricing-section', title: 'Árazás', level: 1 },
        { id: 'images-section', title: 'Képek és referenciák', level: 1 },
        { id: 'schedule-section', title: 'Projekt mérföldkövek', level: 1 },
        { id: 'guarantees-section', title: 'Garanciák', level: 1 },
      ];

      // Filter sections that actually exist
      const existingSections = sections.filter(section => {
        const element = document.getElementById(section.id);
        return element !== null;
      });

      // Only show TOC if there are at least 2 sections
      if (existingSections.length < 2) {
        const tocNav = document.getElementById('toc-nav');
        if (tocNav) tocNav.style.display = 'none';
        return;
      }

      existingSections.forEach((section) => {
        const li = document.createElement('li');
        li.className = 'toc-item toc-level-' + section.level;
        const a = document.createElement('a');
        a.href = '#' + section.id;
        a.className = 'toc-link';
        a.textContent = section.title;
        a.setAttribute('aria-label', 'Ugrás a ' + section.title + ' szekcióhoz');
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.getElementById(section.id);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.toc-link').forEach((link) => link.classList.remove('active'));
            a.classList.add('active');
          }
        });
        li.appendChild(a);
        tocList.appendChild(li);
      });

      // Highlight active section on scroll
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll('.toc-link').forEach((link) => {
              link.classList.remove('active');
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('active');
              }
            });
          }
        });
      }, observerOptions);

      existingSections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) observer.observe(element);
      });
    })();
  </script>
  <div class="container">
    <header class="header" role="banner">
      <div class="header-content">
        ${logoUrl && typeof logoUrl === 'string' && logoUrl.trim() ? `<img src="${sanitizeInput(logoUrl)}" alt="${sanitizeInput(ctx.companyName)} logó" class="logo" role="img">` : ''}
        <div class="header-text">
          <h1>${sanitizeInput(ctx.title)}</h1>
          <p>${sanitizeInput(ctx.companyName)}</p>
        </div>
      </div>
      <div class="header-meta" role="contentinfo" aria-label="Ajánlat metaadatok">
        ${ctx.contactName ? `<div><strong>Címzett:</strong> <span aria-label="Címzett neve">${sanitizeInput(ctx.contactName)}</span></div>` : ''}
        <div><strong>Dátum:</strong> <time datetime="${new Date().toISOString()}" aria-label="Ajánlat kiadásának dátuma">${sanitizeInput(ctx.issueDate)}</time></div>
      </div>
    </header>

    <main class="main" id="main-content" role="main" aria-label="Ajánlat tartalma">
      <nav class="toc-container" id="toc-nav" aria-label="Tartalomjegyzék" role="navigation">
        <div class="toc-title">Tartalomjegyzék</div>
        <ul class="toc-list" id="toc-list" role="list"></ul>
      </nav>
      <div class="main-content">
      <section class="body-section section-anchor" id="body-section" aria-labelledby="body-section-title">
        <h2 id="body-section-title" class="sr-only">Ajánlat részletei</h2>
        <div class="body-content" role="article">
          ${embedVideoLinks(ctx.bodyHtml)}
        </div>
      </section>

      ${
        ctx.images.length > 0
          ? `
      <section class="images-section section-anchor" id="images-section" aria-labelledby="images-section-title">
        <h2 class="section-title" id="images-section-title">Képek és referenciák</h2>
        <div class="images-grid" role="list" aria-label="Referenciaképek galéria">
          ${ctx.images.map((img, idx) => `<div role="listitem"><img src="${sanitizeInput(img.src)}" alt="${sanitizeInput(img.alt || 'Referenciakép')}" loading="lazy" data-lightbox-index="${idx}" aria-label="Kép ${idx + 1}: ${sanitizeInput(img.alt || 'Referenciakép')}" tabindex="0"></div>`).join('')}
        </div>
      </section>
      `
          : ''
      }

      ${ctx.pricingRows.length > 0 ? `<section class="section-anchor" id="pricing-section">${generatePricingTable(ctx.pricingRows, totals, ctx.locale)}</section>` : ''}

      ${
        ctx.schedule && Array.isArray(ctx.schedule) && ctx.schedule.length > 0
          ? `
      <section class="list-section section-anchor" id="schedule-section" aria-labelledby="schedule-section-title">
        <h2 class="section-title" id="schedule-section-title">Projekt mérföldkövek</h2>
        <ul>
          ${ctx.schedule.map((item) => `<li>${sanitizeInput(item)}</li>`).join('')}
        </ul>
      </section>
      `
          : ''
      }

      ${
        ctx.guarantees && Array.isArray(ctx.guarantees) && ctx.guarantees.length > 0
          ? `
      <section class="list-section section-anchor" id="guarantees-section" aria-labelledby="guarantees-section-title">
        <h2 class="section-title" id="guarantees-section-title">Garanciák</h2>
        <ul>
          ${ctx.guarantees.map((item) => `<li>${sanitizeInput(item)}</li>`).join('')}
        </ul>
      </section>
      `
          : ''
      }
      </div>
    </main>

    <footer class="footer" role="contentinfo" aria-label="Kapcsolattartási információk">
      <div class="footer-grid">
        ${ctx.contactEmail ? `<div class="footer-item"><strong>E-mail:</strong><a href="mailto:${sanitizeInput(ctx.contactEmail)}" aria-label="Email küldése: ${sanitizeInput(ctx.contactEmail)}">${sanitizeInput(ctx.contactEmail)}</a></div>` : ''}
        ${ctx.contactPhone ? `<div class="footer-item"><strong>Telefon:</strong><a href="tel:${sanitizeInput(ctx.contactPhone)}" aria-label="Telefon: ${sanitizeInput(ctx.contactPhone)}">${sanitizeInput(ctx.contactPhone)}</a></div>` : ''}
        ${ctx.companyWebsite ? `<div class="footer-item"><strong>Weboldal:</strong><a href="${sanitizeInput(ctx.companyWebsite)}" target="_blank" rel="noopener noreferrer" aria-label="Weboldal megnyitása új ablakban: ${sanitizeInput(ctx.companyWebsite)}">${sanitizeInput(ctx.companyWebsite)}</a></div>` : ''}
        ${ctx.companyAddress ? `<div class="footer-item"><strong>Cím:</strong><address aria-label="Cég címe">${sanitizeInput(ctx.companyAddress)}</address></div>` : ''}
        ${ctx.companyTaxId ? `<div class="footer-item"><strong>Adószám:</strong><span aria-label="Adószám">${sanitizeInput(ctx.companyTaxId)}</span></div>` : ''}
      </div>
      <div class="footer-copyright">
        <small>© ${new Date().getFullYear()} ${sanitizeInput(ctx.companyName)}. Minden jog fenntartva.</small>
      </div>
    </footer>
  </div>
</body>
</html>`;
}
