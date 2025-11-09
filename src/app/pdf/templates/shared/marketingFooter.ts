import { sanitizeInput } from '@/lib/sanitize';

import type { Translator } from '@/copy';

/**
 * Marketing footer for free templates
 * Includes attribution to Vyndi AI, upsell message, and homepage link
 */
export function renderMarketingFooter(
  i18n: Translator,
  homepageUrl: string = 'https://vyndi.hu',
): string {
  const safeUrl = sanitizeInput(homepageUrl);
  const brandName = 'Vyndi AI';
  // Try to get translated messages, fallback to Hungarian defaults
  const generatedByText =
    i18n.t('pdf.templates.marketing.generatedBy', { default: 'Ez az ajánlat a' }) ||
    'Ez az ajánlat a';
  const upsellMessage =
    i18n.t('pdf.templates.marketing.upsell', {
      default: 'Frissíts Pro csomagra a prémium sablonokért és haladó funkciókért.',
    }) || 'Frissíts Pro csomagra a prémium sablonokért és haladó funkciókért.';
  const linkText =
    i18n.t('pdf.templates.marketing.visitLink', { default: 'Látogasd meg a Vyndi AI-t' }) ||
    'Látogasd meg a Vyndi AI-t';

  return `
    <div class="offer-doc__marketing-footer">
      <p class="offer-doc__marketing-text">
        ${generatedByText} <strong>${sanitizeInput(brandName)}</strong> által készült. 
        ${sanitizeInput(upsellMessage)} 
        <a href="${safeUrl}" class="offer-doc__marketing-link" target="_blank" rel="noopener noreferrer">${sanitizeInput(linkText)}</a>
      </p>
    </div>
  `;
}
