export const PRINT_BASE_CSS = `
  :root {
    --page-margin-top: 15mm;
    --page-margin-right: 15mm;
    --page-margin-bottom: 15mm;
    --page-margin-left: 15mm;
    --page-header-height: 20mm;
    --page-footer-height: 20mm;
    --page-header-gap: 8mm;
    --page-header-padding: 4mm;
    --page-footer-margin: 12mm;
    --page-footer-padding: 4mm;
    --page-safe-inset: 3mm;
    --page-header-offset: 0mm;
    --page-footer-offset: 0mm;
  }

  @page {
    size: A4;
    margin: var(--page-header-height) var(--page-margin-right) var(--page-footer-height) var(--page-margin-left);
  }

  @page :first {
    margin-top: var(--page-header-height);
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
    padding: 0;
    position: relative;
  }
  
  .offer-doc--modern {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }

  .offer-doc__header {
    background: var(--brand-bg, #ffffff);
    margin-bottom: var(--page-header-gap);
    padding-bottom: var(--page-header-padding);
    position: static;
  }
  
  .offer-doc__header.first-page-only {
    margin-bottom: var(--page-header-gap);
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

  .section-card {
    background: var(--brand-bg, #ffffff);
    border: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
    border-radius: 18px;
    margin-bottom: 18px;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: auto;
    page-break-after: auto;
  }
  
  .section-card--header {
    break-after: auto;
    page-break-after: auto;
  }

  .section-card__body {
    display: grid;
    gap: 18px;
    padding: 22px 24px;
  }

  .section-card--header {
    background: transparent;
    border: none;
    margin-bottom: var(--page-header-gap);
  }

  .section-card--header .section-card__body {
    padding: 0;
  }

  .section-card--pricing .section-card__body {
    gap: 20px;
  }

  .section-card--gallery {
    background: transparent;
  }

  .section-card--gallery .section-card__body {
    gap: 16px;
    padding: 0;
  }

  .section-stack {
    display: grid;
    gap: 24px;
    break-inside: auto;
    page-break-inside: auto;
  }

  .key-metrics {
    display: grid;
    gap: 8px;
  }

  .key-metrics__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .key-metrics__label {
    font-weight: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
  }

  .key-metrics__value {
    font-weight: 600;
  }

  .key-metrics__value--placeholder {
    font-style: italic;
    opacity: 0.8;
  }

  .section-card--header .key-metrics {
    justify-items: end;
  }

  .section-card--header .key-metrics__item {
    align-items: flex-end;
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
    column-gap: 8mm;
    display: none;
    font-size: 8pt;
    font-weight: 500;
    justify-content: space-between;
    line-height: 1.3;
  }


  .slim-header__title {
    font-weight: 600;
  }

  .slim-footer__page-number {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
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
      padding: 0;
    }

    .offer-doc__slim-bar {
      display: flex !important;
    }

    .slim-header,
    .slim-footer {
      background: var(--brand-bg, #ffffff);
      color: var(--muted, #1f2937);
      display: flex !important;
      justify-content: space-between;
      padding: var(--page-safe-inset) 0;
      position: fixed;
      left: var(--page-margin-left);
      right: var(--page-margin-right);
      z-index: 1000;
      pointer-events: none;
    }

    .slim-header {
      top: 0;
      border-bottom: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-bottom: var(--page-header-padding);
    }

    .slim-footer {
      bottom: 0;
      border-top: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-top: var(--page-footer-padding);
    }

    .slim-footer__page-number::after {
      content: ' ' counter(page) ' / ' counter(pages);
    }
    
    .first-page-only {
      display: block;
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
  .offer-doc__table--force-break {
    break-before: page;
    page-break-before: always;
  }
  
  .page-break-before {
    break-before: page;
    page-break-before: always;
  }
  
  .page-break-after {
    break-after: page;
    page-break-after: always;
  }
  
  .no-page-break {
    break-before: avoid;
    break-after: avoid;
    page-break-before: avoid;
    page-break-after: avoid;
  }
  .page-avoid-break {
    break-before: avoid;
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
`;
