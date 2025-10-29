export const PRINT_BASE_CSS = `
  @page {
    size: A4;
    margin: 24mm 16mm 24mm;
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
    background: #f8fafc;
    color: #0f172a;
    font: 400 11pt/1.5 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  }

  .offer-doc {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    margin: 0;
    background: #ffffff;
    border: none;
    box-shadow: none;
    padding-top: 34mm;
    padding-bottom: 28mm;
    position: relative;
  }

  .offer-doc__header {
    background: #ffffff;
    margin-bottom: 12mm;
    padding-bottom: 6mm;
    position: static;
  }

  .offer-doc__header-brand {
    gap: 12mm;
  }

  .offer-doc__logo-wrap {
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
    background: #ffffff;
    border-top: 1px solid rgba(15, 23, 42, 0.12);
    margin-top: 18mm;
    padding-top: 6mm;
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
    color: #1f2937;
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
      padding-top: 34mm;
      padding-bottom: 28mm;
    }

    .not-first-page {
      display: flex;
    }

    .slim-header,
    .slim-footer {
      background: rgba(255, 255, 255, 0.96);
      border: none;
      color: #1f2937;
      display: flex;
      justify-content: space-between;
      left: 16mm;
      pointer-events: none;
      right: 16mm;
      padding: 4mm 0;
      position: fixed;
      z-index: 40;
    }

    .slim-header {
      top: 10mm;
      border-bottom: 1px solid rgba(15, 23, 42, 0.12);
    }

    .slim-footer {
      bottom: 12mm;
      border-top: 1px solid rgba(15, 23, 42, 0.12);
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
`;
