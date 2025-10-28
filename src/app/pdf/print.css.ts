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
