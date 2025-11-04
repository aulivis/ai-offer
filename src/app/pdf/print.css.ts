export const PRINT_BASE_CSS = `
  :root {
    --page-margin-top: 24mm;
    --page-margin-right: 16mm;
    --page-margin-bottom: 24mm;
    --page-margin-left: 16mm;
    --page-first-margin-top: 28mm;
    --page-header-clearance: 34mm;
    --page-footer-clearance: 28mm;
    --page-header-gap: 12mm;
    --page-header-padding: 6mm;
    --page-footer-margin: 18mm;
    --page-footer-padding: 6mm;
    --page-safe-inset: 4mm;
    --page-header-offset: 10mm;
    --page-footer-offset: 12mm;
  }

  @page {
    size: A4;
    margin: 24mm 16mm;
  }

  @page :first {
    margin-top: 28mm;
  }

  html,
  body {
    height: 100%;
  }

  body {
    margin: 0;
    background: var(--bg, #f8fafc);
    color: var(--text, #0f172a);
    font: 400 11pt/1.5 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  }

  .offer-doc {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    margin: 0;
    background: var(--brand-bg, #ffffff);
    border: none;
    box-shadow: none;
    padding-top: var(--page-header-clearance);
    padding-bottom: var(--page-footer-clearance);
    position: relative;
  }

  .offer-doc__header {
    background: var(--brand-bg, #ffffff);
    margin-bottom: var(--page-header-gap);
    padding-bottom: var(--page-header-padding);
    position: static;
  }

  .offer-doc__header-brand {
    gap: 12mm;
  }

  .offer-doc__logo-wrap {
    background: var(--brand-secondary, #e2e8f0);
    border: 1px solid var(--brand-border, #475569);
    border-radius: 10mm;
    height: 34mm;
    padding: 6mm;
    width: 34mm;
  }

  .offer-doc__logo {
    max-height: 28mm;
    max-width: 100%;
  }

  .offer-doc__monogram {
    font-size: 12pt;
    height: 28mm;
    width: 28mm;
  }

  .offer-doc__meta {
    min-width: auto;
  }

  .offer-doc__meta-label {
    font-size: 7pt;
  }

  .offer-doc__meta-value {
    font-size: 10pt;
  }

  .offer-doc__footer {
    background: var(--brand-bg, #ffffff);
    border-top: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
    margin-top: var(--page-footer-margin);
    padding-top: var(--page-footer-padding);
    position: static;
  }

  .offer-doc__footer-grid {
    gap: 12mm;
  }

  .offer-doc__footer-column {
    gap: 4mm;
  }

  .offer-doc__footer-label {
    font-size: 7pt;
  }

  .offer-doc__footer-value {
    font-size: 9.5pt;
  }

  .offer-doc__slim-bar {
    align-items: center;
    color: var(--muted, #1f2937);
    column-gap: 10mm;
    display: none;
    font-size: 9pt;
    font-weight: 500;
    justify-content: space-between;
    line-height: 1.3;
  }

  .slim-header__title {
    font-weight: 600;
  }

  .slim-footer__page-number {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .first-page-only {
    display: block;
  }

  .not-first-page {
    display: none;
  }

  @media print {
    .offer-doc {
      padding-top: var(--page-header-clearance);
      padding-bottom: var(--page-footer-clearance);
    }

    .not-first-page {
      display: flex;
    }

    .slim-header,
    .slim-footer {
      background: rgba(255, 255, 255, 0.96);
      background: color-mix(in srgb, var(--brand-bg, #ffffff) 96%, transparent);
      border: none;
      color: var(--muted, #1f2937);
      display: flex;
      justify-content: space-between;
      left: var(--page-margin-left);
      pointer-events: none;
      right: var(--page-margin-right);
      padding: var(--page-safe-inset) 0;
      position: fixed;
      z-index: 40;
    }

    .slim-header {
      top: var(--page-header-offset);
      border-bottom: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
    }

    .slim-footer {
      bottom: var(--page-footer-offset);
      border-top: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
    }

    .slim-footer__page-number::after {
      content: ' ' counter(page) ' / ' counter(pages);
    }

    body.printing .slim-footer,
    body.printing .slim-header {
      position: fixed;
    }
  }

  p {
    margin: 0 0 1em;
  }

  table,
  th,
  td {
    font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.4;
  }

  ul,
  ol,
  table {
    widows: 2;
    orphans: 2;
  }
  .offer-doc__content h1,
  .offer-doc__content h2,
  .offer-doc__content h3,
  .offer-doc__content h4,
  .offer-doc__section-title {
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__content .section,
  .offer-doc__content .pricing-summary,
  .section,
  .pricing-summary,
  .offer-doc__table,
  .offer-doc__section-note {
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__pricing-table,
  .offer-doc__pricing-table thead,
  .offer-doc__pricing-table tbody,
  .offer-doc__pricing-table tfoot,
  .offer-doc__pricing-table tr,
  .offer-doc__pricing-table th,
  .offer-doc__pricing-table td {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__table--force-break,
  .page-break-before {
    break-before: page;
    page-break-before: always;
  }
  .page-avoid-break {
    break-before: avoid;
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
`;
