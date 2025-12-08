import { PRINT_BASE_CSS } from '@/app/pdf/print.css';

/**
 * @deprecated This constant is deprecated. Templates should include their own styles.
 * This is kept only for backward compatibility and will be removed in a future version.
 *
 * Shared CSS for the rendered offer document. The rules only target the
 * `.offer-doc` namespace so that we can safely inject the styles into the
 * dashboard preview without affecting the surrounding page.
 *
 * New code should use template-specific styles from the HTML template system.
 */
export const OFFER_DOCUMENT_STYLES = `
  .offer-doc {
    --brand-primary: #1c274c;
    --brand-primary-contrast: #ffffff;
    --brand-secondary: #e2e8f0;
    --brand-secondary-border: #475569;
    --brand-secondary-text: #334155;
    --brand-muted: #334155;
    --brand-text: #0f172a;
    --brand-bg: #ffffff;
    --brand-border: #475569;
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2.75rem;
    --font-body: 400 0.95rem/1.65 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h1: 700 1.9rem/1.2 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h2: 600 1.15rem/1.4 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h3: 600 1.15rem/1.4 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-table: 600 0.72rem/1.2 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --radius-sm: 0.75rem;
    --radius-md: 1.25rem;
    --radius-lg: 2rem;
    background: var(--brand-bg, #ffffff);
    color: var(--brand-text, #0f172a);
    font: var(--font-body, 400 0.95rem/1.65 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    margin: 0 auto;
    max-width: 760px;
  }
`;

/**
 * Additional styles only used inside the PDF rendering. We keep them in a
 * separate constant so that the dashboard preview can avoid overriding the
 * surrounding page background.
 */
export const OFFER_DOCUMENT_PDF_STYLES = PRINT_BASE_CSS;

/**
 * Minimal fallback styles for offer documents.
 * Used only when template style extraction fails.
 *
 * @deprecated This is a legacy fallback. Templates should always include their own styles.
 * This will be removed in a future version.
 */
export const OFFER_DOCUMENT_STYLES_FALLBACK = `
  #offer-content-container {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: #0f172a;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  #offer-content-container h1,
  #offer-content-container h2,
  #offer-content-container h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  #offer-content-container p {
    margin-bottom: 1rem;
  }
  #offer-content-container table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
  }
  #offer-content-container th,
  #offer-content-container td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  #offer-content-container th {
    font-weight: 600;
    background: #f8fafc;
  }
`;
