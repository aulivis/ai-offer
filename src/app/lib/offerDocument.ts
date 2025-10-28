import {
  DEFAULT_OFFER_TEMPLATE_ID,
  isOfferTemplateId,
  type OfferTemplateId,
} from './offerTemplates';
import { PRINT_BASE_CSS } from '@/app/pdf/print.css';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * Shared CSS for the rendered offer document.  The rules only target the
 * `.offer-doc` namespace so that we can safely inject the styles into the
 * dashboard preview without affecting the surrounding page.
 */
export const OFFER_DOCUMENT_STYLES = `
  .offer-doc {
    --brand-primary: #151035;
    --brand-primary-contrast: #ffffff;
    --brand-secondary: #f3f4f6;
    --brand-secondary-border: #d1d5db;
    --brand-secondary-text: #1f2937;
    --brand-muted: #6b7280;
    --brand-text: #1f2937;
    --brand-bg: #ffffff;
    --brand-border: #d1d5db;
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2.75rem;
    --font-body: 400 0.95rem/1.65 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h1: 700 1.9rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h2: 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h3: 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-table: 600 0.72rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --radius-sm: 0.75rem;
    --radius-md: 1.25rem;
    --radius-lg: 2rem;
    background: var(--brand-bg, #ffffff);
    color: var(--brand-text, #1f2937);
    font: var(--font-body, 400 0.95rem/1.65 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    margin: 0 auto;
    max-width: 760px;
  }
  .offer-doc--modern {
    border: 1px solid var(--brand-border, #d1d5db);
    border-radius: var(--radius-lg, 32px);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    padding: var(--space-xl, 44px);
  }
  .offer-doc--modern .offer-doc__header {
    align-items: flex-end;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 0.65rem);
    margin-bottom: var(--space-xl, 2.75rem);
    text-align: right;
  }
  .offer-doc--modern .offer-doc__logo {
    align-self: flex-end;
    border-radius: var(--radius-md, 14px);
    max-height: 72px;
    max-width: 260px;
    object-fit: contain;
  }
  .offer-doc--modern .offer-doc__company {
    color: var(--brand-muted, #6b7280);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .offer-doc--modern .offer-doc__title {
    color: var(--brand-primary);
    font: var(--font-h1, 700 1.9rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    margin: 0;
  }
  .offer-doc__content {
    font-size: 0.95rem;
  }
  .offer-doc__content h1,
  .offer-doc__content h2,
  .offer-doc__content h3,
  .offer-doc__content h4 {
    color: var(--brand-primary);
    margin: 2.2rem 0 0.9rem;
  }
  .offer-doc__content h1 {
    font: var(--font-h2, 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    letter-spacing: -0.125rem;
  }
  .offer-doc__content h2,
  .offer-doc__content h3,
  .offer-doc__content h4 {
    font: var(--font-h3, 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
  }
  .offer-doc__content h1:first-child,
  .offer-doc__content h2:first-child,
  .offer-doc__content h3:first-child {
    margin-top: 0;
  }
  .offer-doc__content p {
    margin: 0 0 1rem;
  }
  .offer-doc__content ul,
  .offer-doc__content ol {
    margin: 0 0 1.2rem 1.4rem;
    padding: 0;
    list-style-position: outside;
  }
  .offer-doc__content ul {
    list-style-type: disc;
  }
  .offer-doc__content ol {
    list-style-type: decimal;
  }
  .offer-doc__content ul ul {
    list-style-type: circle;
  }
  .offer-doc__content ol ol,
  .offer-doc__content ul ol {
    list-style-type: lower-alpha;
  }
  .offer-doc__content li {
    margin-bottom: 0.45rem;
  }
  .offer-doc__compact {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }
  .offer-doc__compact-intro {
    background: var(--brand-secondary);
    border: 1px solid var(--brand-secondary-border);
    border-radius: var(--radius-lg, 24px);
    display: grid;
    gap: 1.4rem;
    padding: var(--space-lg, 1.6rem) var(--space-xl, 1.9rem);
  }
  @media (min-width: 640px) {
    .offer-doc__compact-intro {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .offer-doc__compact-block h2,
  .offer-doc__compact-block h3 {
    margin-top: 0;
  }
  .offer-doc__compact-block--highlights ul {
    margin-left: 1.2rem;
  }
  .offer-doc__compact-grid {
    display: grid;
    gap: 1.2rem;
  }
  @media (min-width: 720px) {
    .offer-doc__compact-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .offer-doc__compact-card {
    background: var(--brand-bg, #ffffff);
    border: 1px solid var(--brand-border, #d1d5db);
    border-radius: var(--radius-md, 22px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    padding: var(--space-lg, 1.5rem) var(--space-xl, 1.7rem);
  }
  .offer-doc__compact-card h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
  }
  .offer-doc__compact-bottom {
    display: grid;
    gap: 1.2rem;
  }
  @media (min-width: 720px) {
    .offer-doc__compact-bottom {
      grid-template-columns: 1.15fr 0.85fr;
    }
  }
  .offer-doc__compact-card--accent {
    background: var(--brand-primary);
    border-color: transparent;
    color: var(--brand-primary-contrast);
  }
  .offer-doc__compact-card--accent h3 {
    color: inherit;
  }
  .offer-doc__compact-card--accent ul,
  .offer-doc__compact-card--accent li {
    color: inherit;
  }
  .offer-doc__compact-card--closing {
    background: var(--brand-secondary, #f9fafb);
  }
  .offer-doc__table {
    margin-top: 2.5rem;
  }
  .offer-doc__pricing-table {
    border-collapse: collapse;
    font-size: 0.85rem;
    width: 100%;
  }
  .offer-doc__pricing-table thead th {
    background: var(--brand-secondary);
    border-bottom: 1px solid var(--brand-secondary-border);
    color: var(--brand-secondary-text);
    font: var(--font-table, 600 0.72rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    letter-spacing: 0.08em;
    padding: 0.65rem 0.75rem;
    text-transform: uppercase;
  }
  .offer-doc__pricing-table tbody td {
    border-bottom: 1px solid var(--brand-secondary-border);
    color: var(--brand-text, #374151);
    padding: 0.6rem 0.75rem;
    vertical-align: top;
  }
  .offer-doc__pricing-table tbody tr:last-child td {
    border-bottom: 1px solid var(--brand-secondary-border);
  }
  .offer-doc__pricing-table tfoot td {
    font-weight: 600;
    padding: 0.75rem 0.75rem;
  }
  .offer-doc__pricing-table tfoot tr:first-child td {
    border-top: 2px solid var(--brand-primary);
  }
  .offer-doc__pricing-table tfoot tr:last-child td {
    background: var(--brand-primary);
    color: var(--brand-primary-contrast);
  }
  .offer-doc--premium {
    border-radius: 36px;
    box-shadow: 0 32px 70px rgba(15, 23, 42, 0.12);
    overflow: hidden;
  }
  .offer-doc__header--premium {
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    color: var(--brand-primary-contrast);
    padding: 48px 48px 32px;
  }
  .offer-doc__premium-banner {
    align-items: center;
    display: flex;
    gap: 32px;
  }
  .offer-doc__premium-logo-slot {
    align-items: center;
    border-radius: 24px;
    display: flex;
    height: 140px;
    justify-content: center;
    width: 140px;
  }
  .offer-doc__premium-logo-slot--filled {
    background: rgba(255, 255, 255, 0.12);
  }
  .offer-doc__premium-logo-slot--empty {
    background: transparent;
  }
  .offer-doc__logo--premium {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
  }
  .offer-doc__premium-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.4rem;
  }
  .offer-doc__company--premium {
    color: rgba(255, 255, 255, 0.82);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .offer-doc__title--premium {
    color: #ffffff;
    font-size: 2.15rem;
    font-weight: 700;
    letter-spacing: -0.125rem;
    margin: 0;
  }
  .offer-doc__premium-body {
    background: #f8fafc;
    padding: 40px 48px 48px;
  }
  .offer-doc__content--card {
    background: #ffffff;
    border: 1px solid var(--brand-secondary-border);
    border-radius: var(--radius-lg, 28px);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    padding: 32px 36px;
  }
  .offer-doc__table--card {
    background: #ffffff;
    border: 1px solid var(--brand-secondary-border);
    border-radius: var(--radius-lg, 28px);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    margin-top: 32px;
    overflow: hidden;
  }
  .offer-doc__table--card .offer-doc__pricing-table thead th {
    background: var(--brand-secondary);
  }
  .offer-doc__table--card .offer-doc__pricing-table tfoot tr:first-child td {
    border-top: 3px solid var(--brand-primary);
  }
  .offer-doc__table--card .offer-doc__pricing-table tfoot tr:last-child td {
    background: var(--brand-primary);
    color: var(--brand-primary-contrast);
  }
`;

/**
 * Additional styles only used inside the PDF rendering.  We keep them in a
 * separate constant so that the dashboard preview can avoid overriding the
 * surrounding page background.
 */
export const OFFER_DOCUMENT_PDF_STYLES = PRINT_BASE_CSS;

export interface OfferBrandingOptions {
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export interface OfferDocumentMarkupProps {
  title: string;
  companyName: string;
  aiBodyHtml: string;
  priceTableHtml: string;
  branding?: OfferBrandingOptions;
  templateId?: OfferTemplateId | null;
}

function normalizeColor(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(trimmed)) return null;
  return `#${trimmed.slice(1).toLowerCase()}`;
}

function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

function sanitizeLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Build the inner HTML fragment shared by both the dashboard preview and the
 * PDF generator.  The returned markup always wraps content in a root
 * `.offer-doc` element so that the shared CSS can target it.
 */
export function offerBodyMarkup({
  title,
  companyName,
  aiBodyHtml,
  priceTableHtml,
  branding,
  templateId,
}: OfferDocumentMarkupProps): string {
  const safeTitle = sanitizeInput(title || 'Árajánlat');
  const safeCompany = sanitizeInput(companyName || '');
  const primaryColor = normalizeColor(branding?.primaryColor) ?? '#0f172a';
  const secondaryColor = normalizeColor(branding?.secondaryColor) ?? '#f3f4f6';
  const secondaryBorder = '#D1D5DB';
  const primaryContrast = contrastColor(primaryColor);
  const logoUrl = sanitizeLogoUrl(branding?.logoUrl);
  const styleAttr = `--brand-primary: ${primaryColor}; --brand-primary-contrast: ${primaryContrast}; --brand-secondary: ${secondaryColor}; --brand-secondary-border: ${secondaryBorder}; --brand-secondary-text: #1F2937;`;
  const normalizedTemplate = isOfferTemplateId(templateId) ? templateId : DEFAULT_OFFER_TEMPLATE_ID;

  if (normalizedTemplate === 'premium-banner') {
    const logoSlot = logoUrl
      ? `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--filled"><img class="offer-doc__logo offer-doc__logo--premium" src="${sanitizeInput(logoUrl)}" alt="Cég logó" /></div>`
      : `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--empty"></div>`;
    return `
      <article class="offer-doc offer-doc--premium" style="${styleAttr}">
        <header class="offer-doc__header offer-doc__header--premium">
          <div class="offer-doc__premium-banner">
            ${logoSlot}
            <div class="offer-doc__premium-text">
              <div class="offer-doc__company offer-doc__company--premium">${safeCompany || 'Vállalat neve'}</div>
              <h1 class="offer-doc__title offer-doc__title--premium">${safeTitle}</h1>
            </div>
          </div>
        </header>
        <div class="offer-doc__premium-body">
          <section class="offer-doc__content offer-doc__content--card">
            ${aiBodyHtml}
          </section>
          <section class="offer-doc__table offer-doc__table--card">
            ${priceTableHtml}
          </section>
        </div>
      </article>
    `;
  }

  const logoMarkup = logoUrl
    ? `<img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="Cég logó" />`
    : '';

  return `
    <article class="offer-doc offer-doc--modern" style="${styleAttr}">
      <header class="offer-doc__header">
        ${logoMarkup}
        <div class="offer-doc__company">${safeCompany || 'Vállalat neve'}</div>
        <h1 class="offer-doc__title">${safeTitle}</h1>
      </header>
      <section class="offer-doc__content">
        ${aiBodyHtml}
      </section>
      <section class="offer-doc__table">
        ${priceTableHtml}
      </section>
    </article>
  `;
}
