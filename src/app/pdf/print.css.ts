export const PRINT_BASE_CSS = `
  @page {
    size: A4;
    margin: 24mm 16mm;

    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 9pt;
      color: #334155;
    }
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
    padding-top: 60mm;
    padding-bottom: 42mm;
    position: relative;
  }

  .offer-doc__header {
    background: #ffffff;
    left: 16mm;
    margin-bottom: 0;
    padding-bottom: 6mm;
    position: fixed;
    right: 16mm;
    top: 18mm;
    z-index: 20;
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
    bottom: 18mm;
    left: 16mm;
    margin-top: 0;
    padding-top: 6mm;
    position: fixed;
    right: 16mm;
    z-index: 20;
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
`;
