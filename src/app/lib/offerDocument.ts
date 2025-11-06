import {
  DEFAULT_OFFER_TEMPLATE_ID,
  normalizeTemplateId,
} from './offerTemplates';
import type { TemplateId } from '@/app/pdf/templates/types';
import { renderSectionHeading } from './offerSections';
import { PRINT_BASE_CSS } from '@/app/pdf/print.css';
import { ensureSafeHtml, sanitizeInput } from '@/lib/sanitize';
import { deriveBrandMonogram, normalizeBrandHex, sanitizeBrandLogoUrl } from '@/lib/branding';

/**
 * Shared CSS for the rendered offer document.  The rules only target the
 * `.offer-doc` namespace so that we can safely inject the styles into the
 * dashboard preview without affecting the surrounding page.
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
    --font-body: 400 0.95rem/1.65 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h1: 700 1.9rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h2: 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-h3: 600 1.15rem/1.4 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --font-table: 600 0.72rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    --radius-sm: 0.75rem;
    --radius-md: 1.25rem;
    --radius-lg: 2rem;
    background: var(--brand-bg, #ffffff);
    color: var(--brand-text, #0f172a);
    font: var(--font-body, 400 0.95rem/1.65 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    margin: 0 auto;
    max-width: 760px;
  }
  .offer-doc--modern {
    border: 1px solid var(--brand-border, #475569);
    border-radius: var(--radius-lg, 32px);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    padding: var(--space-xl, 44px);
  }
  .offer-doc__slim-bar {
    display: none;
  }
  .slim-header,
  .slim-footer {
    align-items: center;
    color: var(--brand-muted, #334155);
    font-size: 0.75rem;
    font-weight: 500;
    gap: var(--space-sm, 0.5rem);
    justify-content: space-between;
    line-height: 1.3;
  }
  .slim-header__title {
    font-weight: 600;
  }
  .slim-footer__page-number {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .first-page-only {
    display: block;
  }
  .not-first-page {
    display: none;
  }
  .offer-doc__header {
    align-items: flex-start;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    display: flex;
    gap: var(--space-lg, 1.5rem);
    justify-content: space-between;
    margin-bottom: var(--space-xl, 2.75rem);
    padding-bottom: var(--space-lg, 1.5rem);
  }
  .offer-doc__header-brand {
    align-items: center;
    display: flex;
    gap: var(--space-lg, 1.5rem);
  }
  .offer-doc p {
    hyphens: auto;
    overflow-wrap: anywhere;
  }
  .offer-doc__logo-wrap {
    align-items: center;
    background: var(--brand-secondary, #e2e8f0);
    border: 1px solid var(--brand-border, #475569);
    border-radius: var(--radius-md, 14px);
    display: flex;
    height: 88px;
    justify-content: center;
    padding: 12px;
    flex-shrink: 0;
    width: 88px;
  }
  .offer-doc__logo {
    max-height: 72px;
    max-width: 220px;
    object-fit: contain;
  }
  .offer-doc__monogram {
    align-items: center;
    background: var(--brand-primary, #1c274c);
    border-radius: var(--radius-md, 14px);
    color: var(--brand-primary-contrast, #ffffff);
    display: flex;
    font-size: 1.5rem;
    font-weight: 700;
    height: 72px;
    justify-content: center;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    width: 72px;
  }
  .offer-doc__header-text {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .offer-doc__company {
    color: var(--brand-muted, #334155);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .offer-doc__title {
    color: var(--brand-primary);
    font: var(--font-h1, 700 1.9rem/1.2 'Work Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif);
    margin: 0;
  }
  .offer-doc__meta {
    align-items: flex-end;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 160px;
    flex-shrink: 0;
    text-align: right;
  }
  .offer-doc__meta-label {
    color: var(--brand-muted, #334155);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .offer-doc__meta-value {
    color: var(--brand-text, #0f172a);
    font-size: 0.95rem;
    font-weight: 600;
  }
  .offer-doc__meta-value--placeholder {
    color: var(--brand-muted, #334155);
    font-style: italic;
  }
  .section-card {
    background: rgba(15, 23, 42, 0.02);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-lg, 2rem);
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-card__body {
    display: grid;
    gap: var(--space-md, 1rem);
    padding: var(--space-lg, 1.5rem);
  }
  .section-card--header {
    background: transparent;
    border: none;
  }
  .section-card--header .section-card__body {
    padding: 0;
  }
  .section-card--pricing .section-card__body {
    gap: var(--space-md, 1.25rem);
  }
  .section-card--gallery {
    background: transparent;
    border: none;
  }
  .section-card--gallery .section-card__body {
    padding: 0;
  }
  .section-stack {
    display: grid;
    gap: var(--space-lg, 1.75rem);
  }
  .key-metrics {
    display: grid;
    gap: 0.45rem;
  }
  .key-metrics__item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
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
  @media (max-width: 640px) {
    .offer-doc__header {
      align-items: stretch;
      flex-direction: column;
      text-align: left;
    }
    .offer-doc__header-brand {
      justify-content: flex-start;
    }
    .offer-doc__meta {
      align-items: flex-start;
      text-align: left;
    }
    .section-card--header .key-metrics {
      justify-items: flex-start;
    }
    .section-card--header .key-metrics__item {
      align-items: flex-start;
    }
  }
  .offer-doc__footer {
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    margin-top: var(--space-xl, 2.75rem);
    padding-top: var(--space-lg, 1.5rem);
  }
  .offer-doc__footer-grid {
    display: grid;
    gap: var(--space-lg, 1.5rem);
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  .offer-doc__footer-column {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .offer-doc__footer-label {
    color: var(--brand-muted, #334155);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .offer-doc__footer-label--sub {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    margin-top: 0.25rem;
  }
  .offer-doc__footer-value {
    color: var(--brand-text, #0f172a);
    font-size: 0.92rem;
    word-break: break-word;
  }
  .offer-doc__footer-value--placeholder {
    color: var(--brand-muted, #334155);
    font-style: italic;
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
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__section-title {
    align-items: center;
    display: flex;
    gap: 0.55rem;
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__section-icon {
    color: currentColor;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.1rem;
    width: 1.1rem;
  }
  .offer-doc__section-icon svg {
    display: block;
    height: 100%;
    width: 100%;
  }
  .offer-doc__section-note {
    color: var(--brand-muted, #334155);
    font-size: 0.92rem;
    margin-top: 0.75rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__section-note--compact {
    color: inherit;
    font-weight: 600;
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
    hyphens: auto;
    overflow-wrap: anywhere;
    text-wrap: balance;
    widows: 2;
    orphans: 2;
  }
  @supports (text-wrap: pretty) {
    .offer-doc__content p {
      text-wrap: pretty;
    }
  }
  .offer-doc__content ul,
  .offer-doc__content ol {
    margin: 0 0 1.2rem 1.4rem;
    padding: 0;
    list-style-position: outside;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__content .section,
  .offer-doc__content .pricing-summary,
  .section,
  .pricing-summary {
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
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
    break-inside: avoid;
    page-break-inside: avoid;
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
    border: 1px solid var(--brand-border, #475569);
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
    break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__gallery {
    margin-top: var(--space-xl, 2.75rem);
  }
  .offer-doc__gallery--card {
    background: rgba(15, 23, 42, 0.02);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--radius-lg, 28px);
    padding: var(--space-lg, 1.5rem);
  }
  .offer-doc__gallery-grid {
    display: grid;
    gap: var(--space-md, 1rem);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: var(--space-md, 1rem);
  }
  .offer-doc__gallery-item {
    background: rgba(15, 23, 42, 0.06);
    border-radius: var(--radius-md, 1.25rem);
    overflow: hidden;
  }
  .offer-doc__gallery-item:empty {
    display: none;
  }
  .offer-doc__gallery-image {
    display: block;
    height: 60mm;
    object-fit: cover;
    width: 100%;
  }
  .offer-doc__pricing-table {
    border-collapse: collapse;
    font-size: 0.85rem;
    width: 100%;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .offer-doc__pricing-table thead,
  .offer-doc__pricing-table tbody,
  .offer-doc__pricing-table tfoot,
  .offer-doc__pricing-table tr,
  .offer-doc__pricing-table th,
  .offer-doc__pricing-table td {
    break-inside: avoid;
    page-break-inside: avoid;
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
    color: var(--brand-text, #0f172a);
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
  .offer-doc--premium .offer-doc__gallery--card {
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    padding: 32px 36px;
  }
  @media (max-width: 640px) {
    .offer-doc__gallery-grid {
      grid-template-columns: 1fr;
    }
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
    border-bottom: none;
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
    background: rgba(255, 255, 255, 0.08);
  }
  .offer-doc__monogram--premium {
    align-items: center;
    background: rgba(4, 21, 36, 0.3);
    border-radius: 18px;
    color: #ffffff;
    display: flex;
    font-size: 2rem;
    font-weight: 700;
    height: 96px;
    justify-content: center;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    width: 96px;
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
  .offer-doc__meta--premium {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 28px;
    text-align: right;
  }
  .offer-doc__meta-label--premium {
    color: rgba(255, 255, 255, 0.75);
  }
  .offer-doc__meta-value--premium {
    color: #ffffff;
  }
  .offer-doc__meta-value--premium.offer-doc__meta-value--placeholder {
    color: rgba(255, 255, 255, 0.75);
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
  .offer-doc__table--force-break {
    break-before: page;
    page-break-before: always;
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
  templateId?: TemplateId | null;
  issueDate?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyWebsite?: string | null;
  companyAddress?: string | null;
  companyTaxId?: string | null;
  pricingHeading?: string | null;
}

function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

const FALLBACK_COLORS = {
  primary: '#1c274c',
  secondary: '#e2e8f0',
  text: '#0f172a',
  muted: '#334155',
  border: '#475569',
  bg: '#ffffff',
} as const;

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
  issueDate,
  contactName,
  contactEmail,
  contactPhone,
  companyWebsite,
  companyAddress,
  companyTaxId,
  pricingHeading,
}: OfferDocumentMarkupProps): string {
  const safeTitle = sanitizeInput(title || 'Árajánlat');
  const safeCompany = sanitizeInput(companyName || '');
  const primaryColor = normalizeBrandHex(branding?.primaryColor) ?? FALLBACK_COLORS.primary;
  const secondaryColor = normalizeBrandHex(branding?.secondaryColor) ?? FALLBACK_COLORS.secondary;
  const textColor = FALLBACK_COLORS.text;
  const mutedColor = FALLBACK_COLORS.muted;
  const borderColor = FALLBACK_COLORS.border;
  const backgroundColor = FALLBACK_COLORS.bg;
  const primaryContrast = contrastColor(primaryColor);
  const logoUrl = sanitizeBrandLogoUrl(branding?.logoUrl);
  const styleAttr = `--brand-primary: ${primaryColor}; --brand-primary-contrast: ${primaryContrast}; --brand-secondary: ${secondaryColor}; --brand-secondary-border: ${borderColor}; --brand-secondary-text: ${mutedColor}; --brand-muted: ${mutedColor}; --brand-text: ${textColor}; --brand-bg: ${backgroundColor}; --brand-border: ${borderColor}; --text: ${textColor}; --muted: ${mutedColor}; --border: ${borderColor}; --bg: ${backgroundColor};`;
  const safeStyleAttr = sanitizeInput(styleAttr);
  const normalizedTemplate = normalizeTemplateId(templateId);
  const fallbackValue = '—';
  const safeIssueDate = sanitizeInput(issueDate || '');
  const resolvedIssueDate = safeIssueDate || fallbackValue;
  const issueDateClass = safeIssueDate
    ? 'offer-doc__meta-value'
    : 'offer-doc__meta-value offer-doc__meta-value--placeholder';
  const safeContactName = sanitizeInput(contactName || '');
  const safeContactEmail = sanitizeInput(contactEmail || '');
  const safeContactPhone = sanitizeInput(contactPhone || '');
  const safeCompanyWebsite = sanitizeInput(companyWebsite || '');
  const safeCompanyAddress = sanitizeInput(companyAddress || '');
  const safeCompanyTaxId = sanitizeInput(companyTaxId || '');
  const contactClass = safeContactName
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const emailClass = safeContactEmail
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const phoneClass = safeContactPhone
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const websiteClass = safeCompanyWebsite
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const addressClass = safeCompanyAddress
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const taxClass = safeCompanyTaxId
    ? 'offer-doc__footer-value'
    : 'offer-doc__footer-value offer-doc__footer-value--placeholder';
  const monogram = sanitizeInput(deriveBrandMonogram(companyName || contactName || title));
  const resolvedContactName = safeContactName || fallbackValue;
  const resolvedContactEmail = safeContactEmail || fallbackValue;
  const resolvedContactPhone = safeContactPhone || fallbackValue;
  const resolvedCompanyWebsite = safeCompanyWebsite || fallbackValue;
  const resolvedCompanyAddress = safeCompanyAddress || fallbackValue;
  const resolvedCompanyTaxId = safeCompanyTaxId || fallbackValue;
  const dateLabel = 'Ajánlat dátuma';
  const contactLabel = 'Kapcsolattartó';
  const emailLabel = 'E-mail';
  const phoneLabel = 'Telefon';
  const websiteLabel = 'Weboldal';
  const companyDetailsLabel = 'Cégadatok';
  const addressLabel = 'Cím';
  const taxLabel = 'Adószám';
  const pageLabel = 'Oldal';

  const slimHeaderMarkup = `
    <div class="offer-doc__slim-bar slim-header not-first-page" aria-hidden="true">
      <span class="slim-header__company">${safeCompany || 'Vállalat neve'}</span>
      <span class="slim-header__title">${safeTitle}</span>
      <span class="slim-header__meta">${dateLabel}: ${resolvedIssueDate}</span>
    </div>
  `;

  const slimFooterMarkup = `
    <div class="offer-doc__slim-bar slim-footer not-first-page" aria-hidden="true">
      <span class="slim-footer__meta">${dateLabel}: ${resolvedIssueDate}</span>
      <span class="slim-footer__page-number">${pageLabel}</span>
    </div>
  `;

  const resolvedPricingHeading =
    typeof pricingHeading === 'string' && pricingHeading.trim().length > 0
      ? pricingHeading
      : 'Pricing';
  const pricingHeadingHtml = renderSectionHeading(resolvedPricingHeading, 'pricing');
  const pricingBodyMatch = priceTableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const pricingBodyContent = pricingBodyMatch?.[1] ?? '';
  const pricingRowCount = (pricingBodyContent.match(/<tr\b/gi) || []).length;
  const shouldForcePricingBreak = pricingRowCount > 0 && pricingRowCount <= 3;
  const standardTableClasses = ['offer-doc__table', 'section-card', 'section-card--pricing'];
  const premiumTableClasses = [
    'offer-doc__table',
    'offer-doc__table--card',
    'section-card',
    'section-card--pricing',
  ];
  if (shouldForcePricingBreak) {
    standardTableClasses.push('offer-doc__table--force-break');
    premiumTableClasses.push('offer-doc__table--force-break');
  }

  if (normalizedTemplate === 'premium-banner') {
    const logoSlot = logoUrl
      ? `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--filled"><img class="offer-doc__logo offer-doc__logo--premium" src="${sanitizeInput(logoUrl)}" alt="Cég logó" /></div>`
      : `<div class="offer-doc__premium-logo-slot offer-doc__premium-logo-slot--empty"><span class="offer-doc__monogram offer-doc__monogram--premium">${monogram}</span></div>`;
    const markup = `
      <article class="offer-doc offer-doc--premium" style="${safeStyleAttr}">
        ${slimHeaderMarkup}
        <header class="offer-doc__header offer-doc__header--premium first-page-only">
          <div class="offer-doc__premium-banner">
            ${logoSlot}
            <div class="offer-doc__premium-text">
              <div class="offer-doc__company offer-doc__company--premium">${safeCompany || 'Vállalat neve'}</div>
              <h1 class="offer-doc__title offer-doc__title--premium">${safeTitle}</h1>
            </div>
          </div>
          <div class="offer-doc__meta offer-doc__meta--premium">
            <span class="offer-doc__meta-label offer-doc__meta-label--premium">${dateLabel}</span>
            <span class="offer-doc__meta-value offer-doc__meta-value--premium${safeIssueDate ? '' : ' offer-doc__meta-value--placeholder'}">${resolvedIssueDate}</span>
          </div>
        </header>
        <div class="offer-doc__premium-body">
          <section class="offer-doc__content offer-doc__content--card section-stack">
            ${aiBodyHtml}
          </section>
          <section class="${premiumTableClasses.join(' ')}">
            <div class="section-card__body">
              ${pricingHeadingHtml}
              ${priceTableHtml}
            </div>
          </section>
        </div>
        <footer class="offer-doc__footer first-page-only">
          <div class="offer-doc__footer-grid">
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${contactLabel}</span>
              <span class="${contactClass}">${resolvedContactName}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${emailLabel}</span>
              <span class="${emailClass}">${resolvedContactEmail}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${phoneLabel}</span>
              <span class="${phoneClass}">${resolvedContactPhone}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${websiteLabel}</span>
              <span class="${websiteClass}">${resolvedCompanyWebsite}</span>
            </div>
            <div class="offer-doc__footer-column">
              <span class="offer-doc__footer-label">${companyDetailsLabel}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${addressLabel}</span>
              <span class="${addressClass}">${resolvedCompanyAddress}</span>
              <span class="offer-doc__footer-label offer-doc__footer-label--sub">${taxLabel}</span>
              <span class="${taxClass}">${resolvedCompanyTaxId}</span>
            </div>
          </div>
        </footer>
        ${slimFooterMarkup}
      </article>
    `;
    ensureSafeHtml(markup, 'offer body markup (premium)');
    return markup;
  }

  const logoMarkup = logoUrl
    ? `<div class="offer-doc__logo-wrap"><img class="offer-doc__logo" src="${sanitizeInput(logoUrl)}" alt="Cég logó" /></div>`
    : `<div class="offer-doc__logo-wrap"><span class="offer-doc__monogram">${monogram}</span></div>`;

  const markup = `
    <article class="offer-doc offer-doc--modern" style="${safeStyleAttr}">
      ${slimHeaderMarkup}
      <header class="offer-doc__header first-page-only">
        <div class="offer-doc__header-brand">
          ${logoMarkup}
          <div class="offer-doc__header-text">
            <div class="offer-doc__company">${safeCompany || 'Vállalat neve'}</div>
            <h1 class="offer-doc__title">${safeTitle}</h1>
          </div>
        </div>
        <div class="offer-doc__meta">
          <span class="offer-doc__meta-label">${dateLabel}</span>
          <span class="${issueDateClass}">${resolvedIssueDate}</span>
        </div>
      </header>
      <section class="offer-doc__content section-stack">
        ${aiBodyHtml}
      </section>
      <section class="${standardTableClasses.join(' ')}">
        <div class="section-card__body">
          ${pricingHeadingHtml}
          ${priceTableHtml}
        </div>
      </section>
      <footer class="offer-doc__footer first-page-only">
        <div class="offer-doc__footer-grid">
          <div class="offer-doc__footer-column">
            <span class="offer-doc__footer-label">${contactLabel}</span>
            <span class="${contactClass}">${resolvedContactName}</span>
          </div>
          <div class="offer-doc__footer-column">
            <span class="offer-doc__footer-label">${emailLabel}</span>
            <span class="${emailClass}">${resolvedContactEmail}</span>
            <span class="offer-doc__footer-label offer-doc__footer-label--sub">${phoneLabel}</span>
            <span class="${phoneClass}">${resolvedContactPhone}</span>
          </div>
          <div class="offer-doc__footer-column">
            <span class="offer-doc__footer-label">${websiteLabel}</span>
            <span class="${websiteClass}">${resolvedCompanyWebsite}</span>
          </div>
          <div class="offer-doc__footer-column">
            <span class="offer-doc__footer-label">${companyDetailsLabel}</span>
            <span class="offer-doc__footer-label offer-doc__footer-label--sub">${addressLabel}</span>
            <span class="${addressClass}">${resolvedCompanyAddress}</span>
            <span class="offer-doc__footer-label offer-doc__footer-label--sub">${taxLabel}</span>
            <span class="${taxClass}">${resolvedCompanyTaxId}</span>
          </div>
        </div>
      </footer>
      ${slimFooterMarkup}
    </article>
  `;
  ensureSafeHtml(markup, 'offer body markup (modern)');
  return markup;
}
