import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import type { TemplateId, Branding, TemplateImageAsset } from '@/app/pdf/templates/types';
import type { PriceRow } from '@/app/lib/pricing';
import type { Translator } from '@/copy';
import { logger } from '@/lib/logger';
import type { OfferData } from '@/app/pdf/templates/types';

export interface OfferRenderingOptions {
  offer: OfferData;
  rows: PriceRow[];
  branding?: Branding;
  i18n: Translator;
  templateId: TemplateId;
  images?: TemplateImageAsset[];
}

/**
 * Builds offer HTML with automatic fallback to default template if the requested template fails.
 * This centralizes the fallback logic to avoid code duplication.
 */
export function buildOfferHtmlWithFallback(options: OfferRenderingOptions): string {
  const { templateId, offer, rows, branding, i18n, images } = options;

  try {
    return buildOfferHtml({
      offer,
      rows,
      branding,
      i18n,
      templateId,
      images,
    });
  } catch (error) {
    // If template loading fails, try with fallback template
    logger.warn('Template render failed, using fallback', {
      templateId,
      offerId: offer.templateId,
      error: error instanceof Error ? error.message : String(error),
    });

    try {
      const fallbackId = DEFAULT_OFFER_TEMPLATE_ID;
      return buildOfferHtml({
        offer: {
          ...offer,
          templateId: fallbackId,
          legacyTemplateId: fallbackId.includes('@') ? fallbackId.split('@')[0] : fallbackId,
        },
        rows,
        branding,
        i18n,
        templateId: fallbackId,
        images,
      });
    } catch (fallbackError) {
      // If even fallback fails, log and throw
      logger.error('Failed to render offer with fallback template', fallbackError, {
        templateId,
        fallbackTemplateId: DEFAULT_OFFER_TEMPLATE_ID,
        offerId: offer.templateId,
      });
      throw new Error('Failed to render offer template');
    }
  }
}
