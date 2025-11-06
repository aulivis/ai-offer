import { sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';

export type SafeField = { value: string; isPlaceholder: boolean };

function sanitizeLogoUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

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

function deriveMonogram(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return 'AI';
  }

  const tokens = value
    .trim()
    .split(/[\s,.;:/\\-]+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return 'AI';
  }

  const initials = tokens
    .slice(0, 2)
    .map((token) => token[0]!.toUpperCase())
    .join('');
  return initials || 'AI';
}

function safeField(raw: string | null | undefined, fallback: string): SafeField {
  const sanitized = sanitizeInput(raw ?? '');
  if (!sanitized) {
    return { value: fallback, isPlaceholder: true };
  }
  return { value: sanitized, isPlaceholder: false };
}

export function buildHeaderFooterCtx(ctx: RenderCtx) {
  const companyPlaceholder = sanitizeInput(ctx.i18n.t('pdf.templates.common.companyPlaceholder'));
  const defaultTitle = ctx.i18n.t('pdf.templates.common.defaultTitle');
  const sanitizedDefaultTitle = sanitizeInput(defaultTitle);
  const safeCompany = safeField(ctx.offer.companyName, companyPlaceholder);
  const resolvedTitleSource =
    typeof ctx.offer.title === 'string' && ctx.offer.title.trim().length > 0
      ? ctx.offer.title
      : sanitizedDefaultTitle;
  const safeTitle = sanitizeInput(resolvedTitleSource) || sanitizedDefaultTitle;
  const logoAlt = sanitizeInput(ctx.i18n.t('pdf.templates.common.logoAlt'));
  const logoUrl = sanitizeLogoUrl(ctx.branding?.logoUrl ?? null);
  const safeLogoUrl = logoUrl ? sanitizeInput(logoUrl) : null;
  const fallbackValue = sanitizeInput(ctx.i18n.t('pdf.templates.common.notProvided'));

  const issueDate = safeField(ctx.offer.issueDate, fallbackValue);
  const contactName = safeField(ctx.offer.contactName, fallbackValue);
  const contactEmail = safeField(ctx.offer.contactEmail, fallbackValue);
  const contactPhone = safeField(ctx.offer.contactPhone, fallbackValue);
  const companyWebsite = safeField(ctx.offer.companyWebsite, fallbackValue);
  const companyAddress = safeField(ctx.offer.companyAddress, fallbackValue);
  const companyTaxId = safeField(ctx.offer.companyTaxId, fallbackValue);

  const labels = {
    date: sanitizeInput(ctx.i18n.t('pdf.templates.common.dateLabel')),
    contact: sanitizeInput(ctx.i18n.t('pdf.templates.common.contactLabel')),
    email: sanitizeInput(ctx.i18n.t('pdf.templates.common.emailLabel')),
    phone: sanitizeInput(ctx.i18n.t('pdf.templates.common.phoneLabel')),
    website: sanitizeInput(ctx.i18n.t('pdf.templates.common.websiteLabel')),
    company: sanitizeInput(ctx.i18n.t('pdf.templates.common.companyDetailsLabel')),
    address: sanitizeInput(ctx.i18n.t('pdf.templates.common.addressLabel')),
    taxId: sanitizeInput(ctx.i18n.t('pdf.templates.common.taxIdLabel')),
    page: sanitizeInput(ctx.i18n.t('pdf.templates.common.pageLabel', { default: 'Oldal' })),
  } as const;

  const monogramSource =
    ctx.offer.companyName || ctx.offer.contactName || ctx.offer.title || defaultTitle;
  const monogram = sanitizeInput(deriveMonogram(monogramSource));

  return {
    company: safeCompany,
    title: safeTitle,
    companyPlaceholder,
    logoAlt,
    logoUrl: safeLogoUrl,
    monogram,
    labels,
    issueDate,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
  };
}

export type HeaderFooterCtx = ReturnType<typeof buildHeaderFooterCtx>;
