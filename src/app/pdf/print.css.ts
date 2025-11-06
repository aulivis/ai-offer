export const PRINT_BASE_CSS = `
  :root {
    --page-margin-top: 0mm;
    --page-margin-right: 15mm;
    --page-margin-bottom: 0mm;
    --page-margin-left: 15mm;
    --page-header-height: 12mm;
    --page-footer-height: 12mm;
    --page-header-gap: 8mm;
    --page-header-padding: 4mm;
    --page-footer-margin: 12mm;
    --page-footer-padding: 4mm;
    --page-safe-inset: 2mm;
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
    font: 400 11pt/1.6 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
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
    margin-top: 0;
  }

  .offer-doc__header {
    background: var(--brand-bg, #ffffff);
    margin-top: 0;
    margin-bottom: var(--page-header-gap);
    padding-top: 0;
    padding-bottom: var(--page-header-padding);
    position: static;
  }
  
  .offer-doc__header.first-page-only {
    margin-top: 0;
    margin-bottom: var(--page-header-gap);
    padding-top: 0;
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
    background: transparent;
    border: none;
    border-radius: 0;
    margin-bottom: 0;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: auto;
    page-break-after: auto;
    box-shadow: none;
  }
  
  .section-card--pricing {
    background: rgba(15, 23, 42, 0.02);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .section-card--header {
    break-after: auto;
    page-break-after: auto;
    background: transparent;
    border: none;
    margin-bottom: var(--page-header-gap);
  }

  .section-card__body {
    display: grid;
    gap: 18px;
    padding: 0;
  }

  .section-card--header .section-card__body {
    padding: 0;
  }

  .section-card--pricing .section-card__body {
    gap: 20px;
    padding: 0;
  }

  .section-card--gallery {
    background: transparent;
    border: none;
  }

  .section-card--gallery .section-card__body {
    gap: 16px;
    padding: 0;
  }

  .section-stack {
    display: grid;
    gap: 28px;
    break-inside: auto;
    page-break-inside: auto;
  }
  
  .section-stack > * + * {
    margin-top: 0;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .offer-doc__footer-column {
    gap: 4mm;
    display: flex;
    flex-direction: column;
  }

  .offer-doc__footer-label {
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted, #64748b);
    margin-bottom: 2px;
  }

  .offer-doc__footer-value {
    font-size: 9.5pt;
    line-height: 1.5;
    color: var(--text, #0f172a);
  }
  
  .offer-doc__footer-value--placeholder {
    color: var(--muted, #94a3b8);
    font-style: italic;
  }
  
  .offer-doc__marketing-footer {
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    margin-top: 12mm;
    padding-top: 4mm;
    text-align: center;
  }
  
  .offer-doc__marketing-text {
    color: var(--muted, #64748b);
    font-size: 7.5pt;
    line-height: 1.5;
    margin: 0;
  }
  
  .offer-doc__marketing-link {
    color: var(--brand-primary, #1c274c);
    text-decoration: underline;
    font-weight: 500;
  }
  
  @media print {
    .offer-doc__marketing-link {
      color: var(--brand-primary, #1c274c);
    }
    
    .offer-doc__marketing-link::after {
      content: ' (' attr(href) ')';
      font-size: 0.9em;
      color: var(--muted, #64748b);
      word-break: break-all;
    }
  }

  .offer-doc__slim-bar {
    align-items: center;
    color: var(--muted, #1f2937);
    column-gap: 8mm;
    display: none;
    font-size: 8pt;
    font-weight: 500;
    justify-content: space-between;
    line-height: 1.4;
    min-height: 12mm;
  }
  
  .slim-header,
  .slim-footer {
    position: fixed;
  }
  
  .slim-header__company {
    font-weight: 600;
    color: var(--text, #0f172a);
  }
  
  .slim-header__meta {
    font-size: 7.5pt;
    color: var(--muted, #64748b);
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
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    body {
      background: #ffffff;
      color: #000000;
    }
    
    .offer-doc {
      padding: 0;
      background: #ffffff;
      margin-top: 0;
    }

    .offer-doc__slim-bar,
    .slim-header,
    .slim-footer {
      display: flex !important;
    }
    
    .slim-header,
    .slim-footer {
      background: #ffffff !important;
      color: var(--muted, #1f2937);
      justify-content: space-between;
      padding: var(--page-safe-inset) 0;
      position: fixed !important;
      left: var(--page-margin-left) !important;
      right: var(--page-margin-right) !important;
      width: calc(100% - var(--page-margin-left) - var(--page-margin-right)) !important;
      z-index: 1000;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    .slim-header {
      top: 0 !important;
      border-bottom: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-bottom: var(--page-header-padding);
    }
    
    .slim-footer {
      bottom: 0 !important;
      border-top: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-top: var(--page-footer-padding);
    }

    .slim-footer__page-number::after {
      content: ' ' counter(page) ' / ' counter(pages);
    }
    
    .first-page-only {
      display: block;
    }
    
    .offer-doc__header.first-page-only {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
    
    .offer-doc__content {
      margin-top: 0;
      padding-top: 0;
    }
    
    .section-card {
      background: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    img {
      max-width: 100% !important;
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    a {
      color: inherit;
      text-decoration: underline;
    }
    
    a[href^="http"]:after {
      content: " (" attr(href) ")";
      font-size: 0.85em;
      color: var(--muted, #64748b);
      word-break: break-all;
    }
  }

  p {
    margin: 0 0 1.1em;
    orphans: 3;
    widows: 3;
    text-align: justify;
    text-justify: inter-word;
  }
  
  p:last-child {
    margin-bottom: 0;
  }

  table,
  th,
  td {
    font-family: 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  
  th {
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  ul,
  ol {
    widows: 2;
    orphans: 2;
    padding-left: 1.5em;
  }
  
  li {
    margin-bottom: 0.5em;
    orphans: 2;
    widows: 2;
  }
  
  li:last-child {
    margin-bottom: 0;
  }
  
  table {
    widows: 2;
    orphans: 2;
  }
  .offer-doc__content h1 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
    margin-top: 1.8rem;
    margin-bottom: 0.8rem;
    color: var(--brand-primary, #1c274c);
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  
  .offer-doc__content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.35;
    margin-top: 1.6rem;
    margin-bottom: 0.7rem;
    color: var(--brand-primary, #1c274c);
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  
  .offer-doc__content h3,
  .offer-doc__content h4 {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 1.4rem;
    margin-bottom: 0.6rem;
    color: var(--brand-primary, #1c274c);
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  
  .offer-doc__section-title {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 1.4rem;
    margin-bottom: 0.6rem;
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .offer-doc__content h1:first-child,
  .offer-doc__content h2:first-child,
  .offer-doc__content h3:first-child,
  .offer-doc__content h4:first-child {
    margin-top: 0;
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
  .offer-doc__pricing-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-size: 9.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  
  .offer-doc__pricing-table thead {
    display: table-header-group;
  }
  
  .offer-doc__pricing-table tfoot {
    display: table-footer-group;
  }
  
  .offer-doc__pricing-table thead,
  .offer-doc__pricing-table tbody,
  .offer-doc__pricing-table tfoot {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .offer-doc__pricing-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .offer-doc__pricing-table th,
  .offer-doc__pricing-table td {
    break-inside: avoid;
    page-break-inside: avoid;
    padding: 0.65rem 0.75rem;
    vertical-align: top;
  }
  
  .offer-doc__pricing-table th {
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  
  .offer-doc__pricing-table tbody tr:last-child td {
    border-bottom: none;
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
