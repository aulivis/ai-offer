export const PRINT_BASE_CSS = `
  :root {
    /* CSS custom properties for general use (not in @page rules) */
    /* These are used for spacing within the document, not for @page margins */
    --page-header-gap: 12mm;
    --page-header-padding: 6mm;
    --page-footer-margin: 18mm;
    --page-footer-padding: 6mm;
  }

  @page {
    size: A4;
    /* Fixed margins: Chrome/Puppeteer does not support CSS custom properties (var()) in @page rules */
    /* Using literal values ensures margins are properly applied */
    /* When using Puppeteer templates (displayHeaderFooter: true), templates are rendered within margins */
    /* Top: 20mm for content (slim header handled by Puppeteer template if used) */
    /* Bottom: 25mm for content (footer handled by Puppeteer template if used) */
    /* Sides: 15mm standard margins */
    margin-top: 20mm;
    margin-right: 15mm;
    margin-bottom: 25mm;
    margin-left: 15mm;
  }

  @page :first {
    /* First page: same margins as other pages */
    /* First page header is part of content, not a template */
    margin-top: 20mm;
    margin-right: 15mm;
    margin-bottom: 25mm;
    margin-left: 15mm;
  }

  html,
  body {
    height: 100%;
  }

  body {
    margin: 0;
    background: var(--bg, #f8fafc);
    color: var(--text, #0f172a);
    font: 400 11pt/1.6 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
    font-feature-settings: 'kern' 1, 'liga' 1;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Enhanced typography for print */
  h1, h2, h3, h4, h5, h6 {
    font-feature-settings: 'kern' 1, 'liga' 1;
    text-rendering: optimizeLegibility;
    orphans: 3;
    widows: 3;
  }
  
  /* Ensure sufficient contrast for print */
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Ensure text is readable in grayscale */
    body {
      color: #000000 !important;
      background: #ffffff !important;
    }
    
    /* Darken borders for better visibility in print */
    .offer-doc__header,
    .offer-doc__footer,
    .section-card--pricing {
      border-color: rgba(0, 0, 0, 0.2) !important;
    }
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
    align-items: center;
  }

  .offer-doc__logo-wrap {
    background: var(--brand-secondary, #e2e8f0);
    border: 1px solid var(--brand-border, #475569);
    border-radius: 10mm;
    height: 34mm;
    padding: 6mm;
    width: 34mm;
    flex-shrink: 0;
    margin-right: 0;
  }
  
  .offer-doc__header-text {
    margin-left: 0;
    flex: 1;
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
    min-height: 10mm;
  }
  
  .slim-header,
  .slim-footer {
    position: fixed;
  }
  
  .slim-header__company {
    font-weight: 600;
    color: var(--text, #0f172a);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 40%;
    min-width: 0;
  }
  
  .slim-header__meta {
    font-size: 7.5pt;
    color: var(--muted, #64748b);
  }

  .slim-header__title {
    font-weight: 600;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 60%;
    min-width: 0;
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
      align-items: center;
      position: fixed !important;
      /* Position from page edges - @page margins handle content spacing */
      /* Headers/footers are positioned within the page margins */
      left: 15mm !important;
      right: 15mm !important;
      width: calc(100% - 30mm) !important;
      max-width: calc(100% - 30mm) !important;
      min-width: calc(100% - 30mm) !important;
      box-sizing: border-box;
      z-index: 1000;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .slim-header > div {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .slim-footer > div {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 70%;
    }

    .slim-footer__page-number {
      flex-shrink: 0;
      white-space: nowrap;
    }
    
    /* Header positioning - fixed at top of page within margins */
    .slim-header {
      top: 20mm !important;
      border-bottom: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-top: 4mm !important;
      padding-bottom: 4mm !important;
      height: auto;
      min-height: 10mm;
    }
    
    /* Footer positioning - fixed at bottom of page within margins */
    .slim-footer {
      bottom: 25mm !important;
      border-top: 1px solid var(--brand-border, rgba(15, 23, 42, 0.12));
      padding-top: 4mm !important;
      padding-bottom: 4mm !important;
      height: auto;
      min-height: 10mm;
    }

    /* Page numbering is now handled via Puppeteer's footerTemplate (server-side) */
    /* Hide fixed footer in print mode when using Puppeteer templates */
    /* The data attribute allows us to identify footers that should be hidden */
    .slim-footer[data-puppeteer-footer="hidden"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      overflow: hidden !important;
    }
    
    /* Also hide slim header in print when using Puppeteer templates */
    /* (Header template can be added later if needed) */
    .slim-header {
      /* Keep header for now, but can be hidden if using Puppeteer header template */
    }
    
    /* Hide slim header on first page - use sibling selector since slim header comes after first-page header in DOM */
    /* The DOM order is: header.first-page-only -> slim-header -> content */
    /* So we can hide slim-header when it follows a first-page-only header */
    .offer-doc__header.first-page-only ~ .slim-header {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      overflow: hidden !important;
    }
    
    /* Ensure first-page header is properly styled */
    .offer-doc__header.first-page-only {
      background: #ffffff !important;
      position: relative;
      z-index: 1002 !important; /* Above slim header */
      margin-top: 0 !important;
      padding-top: 0 !important;
      break-after: avoid;
      page-break-after: avoid;
      margin-bottom: var(--page-header-gap) !important;
    }
    
    /* Ensure slim header z-index allows first-page header to cover it when needed */
    .slim-header {
      z-index: 1000; /* Below first-page header when it exists */
    }
    
    /* Content spacing - ensure content doesn't overlap with fixed headers/footers */
    .offer-doc__content {
      margin-top: 0;
      padding-top: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
      /* Ensure content respects page margins set in @page */
      box-sizing: border-box;
    }
    
    /* Ensure main content area matches page margins exactly */
    main,
    .offer-doc {
      padding-left: 0;
      padding-right: 0;
      margin-left: 0;
      margin-right: 0;
      width: 100%;
      box-sizing: border-box;
    }
    
    main {
      padding-top: 0;
      margin-top: 0;
    }
    
    .first-page-only {
      display: block;
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
    line-height: 1.65;
    font-feature-settings: 'kern' 1, 'liga' 1;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
  
  /* Enhanced orphans/widows control */
  p, li, td, th {
    orphans: 3;
    widows: 3;
  }
  
  /* Prevent single lines at page start/end */
  h1, h2, h3, h4, h5, h6 {
    orphans: 3;
    widows: 3;
    page-break-after: avoid;
  }
  
  /* Keep related content together */
  p + h2,
  p + h3,
  p + h4 {
    page-break-before: avoid;
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
  
  /* Enhanced page break control */
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
  
  /* Keep headings with following content */
  h1 + p,
  h2 + p,
  h3 + p,
  h4 + p {
    page-break-before: avoid;
  }
  
  /* Table of Contents styling */
  .offer-toc {
    break-after: page;
    page-break-after: always;
    margin-bottom: 2rem;
  }
  
  .offer-toc__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--brand-primary, #1c274c);
  }
  
  .offer-toc__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .offer-toc__item {
    margin-bottom: 0.5rem;
    break-inside: avoid;
  }
  
  .offer-toc__item a {
    color: var(--brand-text, #0f172a);
    text-decoration: none;
    display: block;
    padding: 0.25rem 0;
  }
  
  .offer-toc__item a:hover {
    text-decoration: underline;
  }
  
  .offer-toc__item--level-2 {
    padding-left: 1.5rem;
  }
  
  .offer-toc__item--level-3 {
    padding-left: 3rem;
  }
  
  /* Skip links for accessibility */
  .offer-skip-link {
    position: absolute;
    left: -9999px;
    z-index: 999;
  }
  
  .offer-skip-link:focus {
    position: static;
    left: auto;
    display: block;
    padding: 0.5rem 1rem;
    background: var(--brand-primary, #1c274c);
    color: var(--brand-primary-contrast, #ffffff);
    text-decoration: none;
  }
  
  /* Watermark styles */
  .offer-watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 4rem;
    font-weight: 700;
    color: var(--brand-primary, #1c274c);
    opacity: 0.1;
    pointer-events: none;
    z-index: 1;
    white-space: nowrap;
    user-select: none;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  
  @media print {
    .offer-watermark {
      opacity: 0.08;
    }
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
