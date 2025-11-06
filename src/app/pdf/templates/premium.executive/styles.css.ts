import { PRINT_BASE_CSS } from '../../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = `
  .offer-doc--executive {
    background: var(--bg, #ffffff);
    color: var(--text, #0f172a);
    position: relative;
  }

  /* Decorative accent bar */
  .offer-doc--executive::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, var(--primary, #0f172a) 0%, var(--secondary, #3b82f6) 100%);
    z-index: 1;
  }

  .offer-doc__header--executive {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border: 2px solid var(--border, #cbd5e1);
    border-radius: var(--radius-md, 0.75rem);
    padding: 2.5rem 3rem;
    margin-bottom: 2.5rem;
    position: relative;
    overflow: hidden;
  }

  .offer-doc__header--executive::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .offer-doc__header-content--executive {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    position: relative;
    z-index: 1;
  }

  .offer-doc__logo-wrap--executive {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    background: var(--bg, #ffffff);
    border: 2px solid var(--border, #cbd5e1);
    border-radius: var(--radius-md, 0.75rem);
    padding: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .offer-doc__logo--executive {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .offer-doc__monogram--executive {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--primary, #0f172a);
    letter-spacing: 0.05em;
  }

  .offer-doc__header-text--executive {
    flex: 1;
  }

  .offer-doc__company--executive {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--secondary, #3b82f6);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.5rem;
  }

  .offer-doc__title--executive {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1.15;
    margin: 0;
    color: var(--text, #0f172a);
    letter-spacing: -0.02em;
  }

  .offer-doc__meta--executive {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #cbd5e1);
    position: relative;
    z-index: 1;
  }

  .offer-doc__meta-item--executive {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .offer-doc__meta-label--executive {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #64748b);
  }

  .offer-doc__meta-value--executive {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text, #0f172a);
  }

  .section-card--executive {
    background: var(--bg, #ffffff);
    border: 1px solid var(--border, #cbd5e1);
    border-radius: var(--radius-md, 0.75rem);
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .section-card__title--executive {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary, #0f172a);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 0 0 1.5rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 3px solid var(--secondary, #3b82f6);
    display: inline-block;
    min-width: 200px;
  }

  .offer-doc__content--executive {
    line-height: 1.75;
    color: var(--text, #0f172a);
  }

  .offer-doc__content--executive h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary, #0f172a);
    margin: 2rem 0 1rem 0;
    padding-left: 1rem;
    border-left: 4px solid var(--secondary, #3b82f6);
  }

  .offer-doc__content--executive h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text, #0f172a);
    margin: 1.5rem 0 0.75rem 0;
  }

  .offer-doc__content--executive p {
    margin: 0 0 1.25rem 0;
  }

  .offer-doc__content--executive ul,
  .offer-doc__content--executive ol {
    margin: 0 0 1.25rem 0;
    padding-left: 1.75rem;
  }

  .offer-doc__content--executive li {
    margin-bottom: 0.5rem;
  }

  .pricing-table__table-wrapper {
    border: 2px solid var(--border, #cbd5e1);
    border-radius: var(--radius-md, 0.75rem);
    overflow: hidden;
    background: var(--bg, #ffffff);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .pricing-table__header {
    background: linear-gradient(135deg, var(--primary, #0f172a) 0%, var(--secondary, #3b82f6) 100%) !important;
    color: #ffffff !important;
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 1rem 1.25rem;
  }

  .pricing-table__row:nth-of-type(even) .pricing-table__cell {
    background-color: rgba(59, 130, 246, 0.02);
  }

  .pricing-table__cell {
    border-bottom: 1px solid var(--border, #cbd5e1);
    padding: 1.25rem;
    font-size: 0.95rem;
  }

  .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
    background: linear-gradient(135deg, var(--primary, #0f172a) 0%, var(--secondary, #3b82f6) 100%) !important;
    color: #ffffff !important;
    font-weight: 700;
    font-size: 1.05rem;
  }

  .pricing-table__footer-row:first-of-type .pricing-table__footer-cell {
    border-top: 3px solid var(--secondary, #3b82f6);
  }

  .offer-doc__gallery--executive {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .offer-doc__gallery-item--executive {
    border-radius: var(--radius-md, 0.75rem);
    overflow: hidden;
    border: 1px solid var(--border, #cbd5e1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .offer-doc__gallery-image--executive {
    width: 100%;
    height: auto;
    display: block;
  }

  .offer-doc__footer--executive {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 3px solid var(--border, #cbd5e1);
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-radius: var(--radius-md, 0.75rem);
    padding: 2rem;
  }

  .offer-doc__footer-grid--executive {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .offer-doc__footer-column--executive {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .offer-doc__footer-label--executive {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--secondary, #3b82f6);
    margin-bottom: 0.25rem;
  }

  .offer-doc__footer-value--executive {
    font-size: 0.9rem;
    color: var(--text, #0f172a);
    font-weight: 500;
  }

  .offer-doc__footer-value--executive.offer-doc__footer-value--placeholder {
    color: var(--muted, #94a3b8);
    font-style: italic;
  }

  @media print {
    .offer-doc--executive::before {
      display: none;
    }

    .offer-doc__header--executive {
      background: #ffffff;
      border: 2px solid #cbd5e1;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .offer-doc__header--executive::before {
      display: none;
    }

    .pricing-table__header {
      background: linear-gradient(135deg, #0f172a 0%, #3b82f6 100%) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pricing-table__footer-row:last-of-type .pricing-table__footer-cell {
      background: linear-gradient(135deg, #0f172a 0%, #3b82f6 100%) !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .offer-doc__footer--executive {
      background: #ffffff;
      border: 3px solid #cbd5e1;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

