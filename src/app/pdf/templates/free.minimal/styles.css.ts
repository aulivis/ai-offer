import { PRINT_BASE_CSS } from '../../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = `
  .offer-doc--minimal {
    background: var(--bg, #ffffff);
    color: var(--text, #1a1a1a);
    padding-top: 0;
    padding-bottom: 0;
    position: relative;
  }

  /* Subtle accent line at the top using brand primary */
  .offer-doc--minimal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--brand-primary, var(--primary, #1a1a1a));
    z-index: 1;
  }

  .offer-template--minimal {
    padding: 0;
    margin: 0;
  }

  .offer-doc__header--minimal {
    border-bottom: 2px solid var(--brand-primary, var(--primary, #1a1a1a));
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
    break-after: avoid;
    page-break-after: avoid;
    position: relative;
    z-index: 2;
  }

  .offer-doc__header-content--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .offer-doc__company--minimal {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--brand-secondary, var(--secondary, #666666));
    text-transform: uppercase;
    letter-spacing: 0.1em;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .offer-doc__title--minimal {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
    color: var(--brand-primary, var(--primary, #1a1a1a));
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    hyphens: auto;
  }

  .offer-doc__meta--minimal {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e0e0e0);
    width: 100%;
    max-width: 100%;
  }

  .offer-doc__meta-item--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 0 1 auto;
    max-width: 100%;
  }

  .offer-doc__meta-label--minimal {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #666666);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .offer-doc__meta-value--minimal {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text, #1a1a1a);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .section-card--minimal {
    background: transparent;
    border: none;
    padding: 0;
    margin-bottom: 2rem;
  }

  .section-card__title--minimal {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--brand-primary, var(--primary, #1a1a1a));
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--brand-primary, var(--primary, #1a1a1a));
  }

  .offer-doc__content--minimal {
    line-height: 1.7;
    color: var(--text, #1a1a1a);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    hyphens: auto;
  }

  .offer-doc__content--minimal h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--brand-primary, var(--primary, #1a1a1a));
    margin: 1.5rem 0 1rem 0;
  }

  .offer-doc__content--minimal h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--brand-primary, var(--primary, #1a1a1a));
    margin: 1.25rem 0 0.75rem 0;
  }

  .offer-doc__content--minimal p {
    margin: 0 0 1rem 0;
  }

  .offer-doc__content--minimal ul,
  .offer-doc__content--minimal ol {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
  }

  .offer-doc__content--minimal li {
    margin-bottom: 0.5rem;
  }

  .pricing-table__table-wrapper {
    border: 1px solid var(--brand-border, var(--border, #e0e0e0));
    border-radius: 0;
    overflow: hidden;
    background: #fafafa;
    position: relative;
  }

  /* Subtle decorative element for pricing table - accent line */
  .pricing-table__table-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--brand-primary, var(--primary, #1a1a1a));
    opacity: 0.4;
    z-index: 1;
  }

  .pricing-table__header {
    background-color: var(--brand-secondary, var(--secondary, #f5f5f5)) !important;
    color: var(--brand-primary, var(--primary, #1a1a1a)) !important;
    font-weight: 600;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.875rem 1rem;
    border-bottom: 2px solid var(--brand-primary, var(--primary, #1a1a1a));
    position: relative;
    z-index: 2;
  }

  .pricing-table__row:nth-of-type(even) .pricing-table__cell {
    background-color: rgba(0, 0, 0, 0.01);
  }

  .pricing-table__cell {
    border-bottom: 1px solid var(--brand-border, var(--border, #e0e0e0));
    padding: 1rem;
    font-size: 0.9rem;
  }

  .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
    background-color: var(--brand-primary, var(--primary, #1a1a1a)) !important;
    color: var(--brand-primary-contrast, var(--bg, #ffffff)) !important;
    font-weight: 600;
  }

  .pricing-table__footer-row:first-of-type .pricing-table__footer-cell {
    border-top: 2px solid var(--brand-primary, var(--primary, #1a1a1a));
  }

  .offer-doc__footer--minimal {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--brand-border, var(--border, #e0e0e0));
  }

  .offer-doc__footer-grid--minimal {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .offer-doc__footer-column--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .offer-doc__footer-label--minimal {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #666666);
    margin-bottom: 0.25rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .offer-doc__footer-label--minimal.offer-doc__footer-label--spaced {
    margin-top: var(--spacing-sm, 0.75rem);
  }

  .offer-doc__footer-value--minimal {
    font-size: 0.85rem;
    color: var(--text, #1a1a1a);
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .offer-doc__footer-value--minimal.offer-doc__footer-value--placeholder {
    color: var(--muted, #999999);
    font-style: italic;
  }

  .offer-doc__marketing-footer {
    border-top: 1px solid var(--border, #e0e0e0);
    margin-top: 2rem;
    padding-top: 1.5rem;
    text-align: center;
  }

  .offer-doc__marketing-text {
    color: var(--muted, #666666);
    font-size: 0.75rem;
    line-height: 1.5;
    margin: 0;
  }

  .offer-doc__marketing-link {
    color: var(--brand-primary, var(--primary, #1a1a1a));
    text-decoration: underline;
    font-weight: 500;
  }

  @media print {
    .offer-doc--minimal {
      background: #ffffff;
      padding-top: 0;
      margin-top: 0;
    }

    /* Ensure accent line prints */
    .offer-doc--minimal::before {
      display: block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .offer-template--minimal {
      padding-top: 0;
      margin-top: 0;
    }

    /* Ensure header doesn't overlap with slim header */
    .offer-doc__header--minimal.first-page-only {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    /* Prevent content from overlapping with fixed headers/footers */
    .offer-doc__header--minimal + .section-card--minimal {
      margin-top: 0;
    }

    /* Hide partialFooter on pages 2+ for consistency */
    /* The partialFooter (first-page-footer) should only appear on the first page */
    /* On pages 2+, only the slimFooter should appear (via fixed positioning) */
    /* Use page break control to keep footer with first page content */
    .offer-doc__footer--minimal.first-page-footer {
      break-inside: avoid;
      page-break-inside: avoid;
      /* Try to keep footer on first page, but if content is too long, hide it on subsequent pages */
      /* This ensures the slimFooter is the only footer visible on pages 2+ */
    }
    
    /* Hide partialFooter when it would appear on page 2+ */
    /* Since we can't easily detect page 2+ with CSS, we ensure it breaks with first page content */
    /* If content flows to page 2, the footer will naturally stay on page 1 or be hidden */
    /* The slimFooter provides consistent footer information on all pages */

    /* Ensure text wraps properly in print */
    .offer-doc__header-content--minimal,
    .offer-doc__title--minimal,
    .offer-doc__company--minimal,
    .offer-doc__content--minimal,
    .offer-doc__footer-value--minimal,
    .offer-doc__footer-label--minimal {
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      max-width: 100%;
    }

    /* Prevent footer grid from overlapping */
    .offer-doc__footer-grid--minimal {
      break-inside: avoid;
      page-break-inside: avoid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    /* Ensure footer columns don't overflow */
    .offer-doc__footer-column--minimal {
      min-width: 0;
      overflow: hidden;
    }

    /* Ensure pricing table decorative element prints */
    .pricing-table__table-wrapper::before {
      display: block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
      background-color: var(--brand-primary, var(--primary, #1a1a1a)) !important;
      color: var(--brand-primary-contrast, #ffffff) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .offer-doc__marketing-link {
      color: var(--brand-primary, var(--primary, #1a1a1a));
    }

    .offer-doc__marketing-link::after {
      content: ' (' attr(href) ')';
      font-size: 0.9em;
      color: var(--muted, #666666);
      word-break: break-all;
    }

    /* Prevent text overflow in meta items */
    .offer-doc__meta--minimal {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .offer-doc__meta-item--minimal {
      min-width: 0;
      flex: 0 1 auto;
    }

    .offer-doc__meta-value--minimal,
    .offer-doc__meta-label--minimal {
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
  }
`;
