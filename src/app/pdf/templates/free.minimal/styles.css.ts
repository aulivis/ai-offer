import { PRINT_BASE_CSS } from '../../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = `
  .offer-doc--minimal {
    background: var(--bg, #ffffff);
    color: var(--text, #1a1a1a);
  }

  .offer-doc__header--minimal {
    border-bottom: 2px solid var(--border, #e0e0e0);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .offer-doc__header-content--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .offer-doc__company--minimal {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--muted, #666666);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .offer-doc__title--minimal {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
    color: var(--text, #1a1a1a);
  }

  .offer-doc__meta--minimal {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e0e0e0);
  }

  .offer-doc__meta-item--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .offer-doc__meta-label--minimal {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #666666);
  }

  .offer-doc__meta-value--minimal {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text, #1a1a1a);
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
    color: var(--muted, #666666);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #e0e0e0);
  }

  .offer-doc__content--minimal {
    line-height: 1.7;
    color: var(--text, #1a1a1a);
  }

  .offer-doc__content--minimal h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text, #1a1a1a);
    margin: 1.5rem 0 1rem 0;
  }

  .offer-doc__content--minimal h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text, #1a1a1a);
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
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 0;
    overflow: hidden;
    background: transparent;
  }

  .pricing-table__header {
    background-color: var(--secondary, #f5f5f5) !important;
    color: var(--text, #1a1a1a) !important;
    font-weight: 600;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.875rem 1rem;
    border-bottom: 2px solid var(--border, #e0e0e0);
  }

  .pricing-table__row:nth-of-type(even) .pricing-table__cell {
    background-color: transparent;
  }

  .pricing-table__cell {
    border-bottom: 1px solid var(--border, #e0e0e0);
    padding: 1rem;
    font-size: 0.9rem;
  }

  .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
    background-color: var(--text, #1a1a1a) !important;
    color: var(--bg, #ffffff) !important;
    font-weight: 600;
  }

  .pricing-table__footer-row:first-of-type .pricing-table__footer-cell {
    border-top: 2px solid var(--border, #e0e0e0);
  }

  .offer-doc__footer--minimal {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border, #e0e0e0);
  }

  .offer-doc__footer-grid--minimal {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
  }

  .offer-doc__footer-column--minimal {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .offer-doc__footer-label--minimal {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #666666);
    margin-bottom: 0.25rem;
  }

  .offer-doc__footer-value--minimal {
    font-size: 0.85rem;
    color: var(--text, #1a1a1a);
  }

  .offer-doc__footer-value--minimal.offer-doc__footer-value--placeholder {
    color: var(--muted, #999999);
    font-style: italic;
  }

  @media print {
    .offer-doc--minimal {
      background: #ffffff;
    }

    .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
      background-color: #1a1a1a !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;





