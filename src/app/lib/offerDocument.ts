import { sanitizeInput } from '@/lib/sanitize';

/**
 * Shared CSS for the rendered offer document.  The rules only target the
 * `.offer-doc` namespace so that we can safely inject the styles into the
 * dashboard preview without affecting the surrounding page.
 */
export const OFFER_DOCUMENT_STYLES = `
  .offer-doc {
    --brand-primary: #0f172a;
    --brand-primary-contrast: #ffffff;
    --brand-secondary: #f3f4f6;
    --brand-secondary-border: #d1d5db;
    --brand-secondary-text: #1f2937;
    background: #ffffff;
    border: 1px solid var(--brand-secondary-border);
    border-radius: 32px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    color: #1f2937;
    font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.65;
    margin: 0 auto;
    max-width: 720px;
    padding: 44px;
  }
  .offer-doc__header {
    align-items: flex-end;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin-bottom: 2.75rem;
    text-align: right;
  }
  .offer-doc__logo {
    align-self: flex-end;
    border-radius: 14px;
    max-height: 72px;
    max-width: 260px;
    object-fit: contain;
  }
  .offer-doc__company {
    color: #6b7280;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .offer-doc__title {
    color: var(--brand-primary);
    font-size: 1.9rem;
    font-weight: 700;
    letter-spacing: -0.01em;
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
    font-size: 1.15rem;
    font-weight: 600;
    margin: 2.2rem 0 0.9rem;
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
  }
  .offer-doc__content li {
    margin-bottom: 0.45rem;
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
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 0.65rem 0.75rem;
    text-transform: uppercase;
  }
  .offer-doc__pricing-table tbody td {
    border-bottom: 1px solid var(--brand-secondary-border);
    color: #374151;
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
`;

/**
 * Additional styles only used inside the PDF rendering.  We keep them in a
 * separate constant so that the dashboard preview can avoid overriding the
 * surrounding page background.
 */
export const OFFER_DOCUMENT_PDF_STYLES = `
  body {
    background: #f8fafc;
    margin: 0;
    padding: 56px 0;
  }
  body, p, table, th, td {
    font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  }
`;

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
}

function normalizeColor(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(trimmed)) return null;
  return `#${trimmed.slice(1).toUpperCase()}`;
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
}: OfferDocumentMarkupProps): string {
  const safeTitle = sanitizeInput(title || 'Árajánlat');
  const safeCompany = sanitizeInput(companyName || '');
  const primaryColor = normalizeColor(branding?.primaryColor) ?? '#0F172A';
  const secondaryColor = normalizeColor(branding?.secondaryColor) ?? '#F3F4F6';
  const secondaryBorder = '#D1D5DB';
  const primaryContrast = contrastColor(primaryColor);
  const logoUrl = sanitizeLogoUrl(branding?.logoUrl);
  const styleAttr = `--brand-primary: ${primaryColor}; --brand-primary-contrast: ${primaryContrast}; --brand-secondary: ${secondaryColor}; --brand-secondary-border: ${secondaryBorder}; --brand-secondary-text: #1F2937;`;
  const logoMarkup = logoUrl
    ? `<img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="Cég logó" />`
    : '';

  return `
    <article class="offer-doc" style="${styleAttr}">
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
