import { PRINT_BASE_CSS } from '../../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = `
  .offer-doc--modern {
    background: var(--bg, #ffffff);
    color: var(--text, #1e293b);
  }

  .offer-doc__header--modern {
    background: linear-gradient(135deg, var(--primary, #2563eb) 0%, var(--secondary, #1e40af) 100%);
    color: #ffffff;
    padding: 2.5rem 3rem;
    margin-bottom: 2rem;
    border-radius: 0;
    box-shadow: none;
  }
  
  @media print {
    .offer-doc__header--modern {
      border-radius: 0;
      box-shadow: none;
    }
  }

  .offer-doc__header-content--modern {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }

  .offer-doc__logo-wrap--modern {
    flex-shrink: 0;
  }

  .offer-doc__logo--modern {
    max-height: 3.5rem;
    max-width: 12rem;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .offer-doc__monogram--modern {
    width: 3.5rem;
    height: 3.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
  }

  .offer-doc__header-text--modern {
    flex: 1;
  }

  .offer-doc__title--modern {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0.5rem 0;
    color: #ffffff;
  }

  .offer-doc__company--modern {
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.9;
    margin-bottom: 0.25rem;
  }

  .offer-doc__meta--modern {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .offer-doc__meta-item--modern {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .offer-doc__meta-label--modern {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }

  .offer-doc__meta-value--modern {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .section-card--modern {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    margin-bottom: 0;
    box-shadow: none;
  }

  .section-card__title--modern {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--primary, #2563eb);
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__content--modern {
    line-height: 1.7;
  }

  .offer-doc__content--modern h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text, #1e293b);
    margin: 1.5rem 0 1rem 0;
  }

  .offer-doc__content--modern h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text, #1e293b);
    margin: 1.25rem 0 0.75rem 0;
  }

  .offer-doc__content--modern p {
    margin: 0 0 1rem 0;
    color: var(--text, #1e293b);
  }

  .offer-doc__content--modern ul,
  .offer-doc__content--modern ol {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
  }

  .offer-doc__content--modern li {
    margin-bottom: 0.5rem;
  }

  .offer-doc__table--modern {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .offer-doc__table--modern thead {
    background: var(--primary, #2563eb);
    color: #ffffff;
  }

  .offer-doc__table--modern th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .offer-doc__table--modern td {
    padding: 1rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__table--modern tbody tr:hover {
    background: #f8fafc;
  }

  .offer-doc__table--modern tbody tr:last-child td {
    border-bottom: none;
  }

  /* Pricing table styling */
  .pricing-table__table-wrapper {
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 8px;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.02);
  }

  .pricing-table__header {
    background-color: var(--primary, #2563eb) !important;
    color: #ffffff !important;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 0.875rem 1rem;
  }

  .pricing-table__row:nth-of-type(even) .pricing-table__cell {
    background-color: #f8fafc;
  }

  .pricing-table__cell {
    border-bottom: 1px solid var(--border, #e2e8f0);
    padding: 1rem;
    font-size: 0.9rem;
  }

  .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
    background-color: var(--primary, #2563eb) !important;
    color: #ffffff !important;
    font-weight: 700;
  }

  .pricing-table__footer-row:first-of-type .pricing-table__footer-cell {
    border-top: 2px solid var(--primary, #2563eb);
  }

  .offer-doc__footer--modern {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__footer-grid--modern {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .offer-doc__footer-column--modern {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .offer-doc__footer-label--modern {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #64748b);
    margin-bottom: 0.25rem;
  }

  .offer-doc__footer-value--modern {
    font-size: 0.9rem;
    color: var(--text, #1e293b);
  }

  @media print {
    .offer-doc--modern {
      background: #ffffff;
    }

    .offer-doc__header--modern {
      background: linear-gradient(135deg, var(--primary, #2563eb) 0%, var(--secondary, #1e40af) 100%);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .offer-doc__table--modern thead {
      background: var(--primary, #2563eb);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pricing-table__header {
      background-color: var(--primary, #2563eb) !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
      background-color: var(--primary, #2563eb) !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

