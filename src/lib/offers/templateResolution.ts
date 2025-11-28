import type { OfferTemplate, TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import { listTemplates, loadTemplate } from '@/app/pdf/templates/engineRegistry';
import {
  normalizeTemplateId,
  DEFAULT_OFFER_TEMPLATE_ID,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import { logger } from '@/lib/logger';

export interface TemplateResolutionContext {
  requestedTemplateId?: string | null;
  profileTemplateId?: string | null;
  plan: SubscriptionPlan;
  offerId?: string;
  userId?: string;
}

export interface ResolvedTemplate {
  template: OfferTemplate;
  templateId: TemplateId;
  resolutionReason: 'requested' | 'profile' | 'default' | 'fallback';
  wasFallback: boolean;
}

function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}

/**
 * Resolves the appropriate template for an offer based on:
 * 1. Requested template ID (from offer inputs)
 * 2. Profile template ID (from user settings)
 * 3. Default template for plan tier
 *
 * This is the centralized template resolution logic used across the application.
 */
export function resolveOfferTemplate(context: TemplateResolutionContext): ResolvedTemplate {
  const { requestedTemplateId, profileTemplateId, plan, offerId, userId } = context;

  // Set logger context for better observability
  const logContext: Record<string, unknown> = {};
  if (offerId) logContext.offerId = offerId;
  if (userId) logContext.userId = userId;

  const planTier = planToTemplateTier(plan);
  const allTemplates = listTemplates() as Array<OfferTemplate>;

  // Get fallback template - ensure it exists
  let fallbackTemplate: OfferTemplate;
  try {
    fallbackTemplate = loadTemplate(DEFAULT_OFFER_TEMPLATE_ID);
  } catch (error) {
    logger.error('Failed to load default template', error, {
      ...logContext,
      defaultTemplateId: DEFAULT_OFFER_TEMPLATE_ID,
    });
    // If default template fails, use first available template
    fallbackTemplate =
      allTemplates[0] ||
      (() => {
        throw new Error('No templates available');
      })();
  }

  const freeTemplates = allTemplates.filter((tpl) => tpl.tier === 'free');
  const defaultTemplateForPlan =
    planTier === 'premium'
      ? allTemplates[0] || fallbackTemplate
      : freeTemplates[0] || fallbackTemplate;

  // Normalize and resolve requested template ID
  const normalizedRequestedId = requestedTemplateId
    ? normalizeTemplateId(requestedTemplateId)
    : null;

  // Try to find the requested template
  let requestedTemplate: OfferTemplate | null = null;
  if (normalizedRequestedId) {
    try {
      // First try direct lookup
      requestedTemplate = allTemplates.find((tpl) => tpl.id === normalizedRequestedId) || null;

      // If not found, try loading it (handles edge cases)
      if (!requestedTemplate) {
        try {
          requestedTemplate = loadTemplate(normalizedRequestedId);
        } catch (error) {
          logger.warn('Requested template not found, will fall back', {
            ...logContext,
            requestedTemplateId: normalizedRequestedId,
            error: error instanceof Error ? error.message : String(error),
          });
          requestedTemplate = null;
        }
      }
    } catch (error) {
      logger.warn('Error loading requested template', {
        ...logContext,
        requestedTemplateId: normalizedRequestedId,
        error: error instanceof Error ? error.message : String(error),
      });
      requestedTemplate = null;
    }
  }

  // Get profile template
  const normalizedProfileId = profileTemplateId ? normalizeTemplateId(profileTemplateId) : null;

  let profileTemplate: OfferTemplate | null = null;
  if (normalizedProfileId) {
    try {
      profileTemplate = allTemplates.find((tpl) => tpl.id === normalizedProfileId) || null;
      if (!profileTemplate) {
        try {
          profileTemplate = loadTemplate(normalizedProfileId);
        } catch (error) {
          logger.warn('Profile template not found, will fall back', {
            ...logContext,
            profileTemplateId: normalizedProfileId,
            error: error instanceof Error ? error.message : String(error),
          });
          profileTemplate = null;
        }
      }
    } catch (error) {
      logger.warn('Error loading profile template', {
        ...logContext,
        profileTemplateId: normalizedProfileId,
        error: error instanceof Error ? error.message : String(error),
      });
      profileTemplate = null;
    }
  }

  const isTemplateAllowed = (tpl: OfferTemplate) => planTier === 'premium' || tpl.tier === 'free';

  // Resolve final template with proper fallback chain
  let template: OfferTemplate;
  let resolvedTemplateId: TemplateId;
  let resolutionReason: ResolvedTemplate['resolutionReason'];
  let wasFallback = false;

  if (requestedTemplate && isTemplateAllowed(requestedTemplate)) {
    // Use requested template if allowed
    template = requestedTemplate;
    resolvedTemplateId = template.id;
    resolutionReason = 'requested';
    logger.debug('Using requested template', {
      ...logContext,
      templateId: resolvedTemplateId,
    });
  } else if (requestedTemplate && !isTemplateAllowed(requestedTemplate)) {
    // Requested template not allowed for plan, use fallback
    template = fallbackTemplate;
    resolvedTemplateId = template.id;
    resolutionReason = 'fallback';
    wasFallback = true;
    logger.warn('Requested template not allowed for plan, using fallback', {
      ...logContext,
      requestedTemplateId: requestedTemplate.id,
      requestedTier: requestedTemplate.tier,
      planTier,
      fallbackTemplateId: resolvedTemplateId,
    });
  } else if (profileTemplate && isTemplateAllowed(profileTemplate)) {
    // Use profile template if allowed
    template = profileTemplate;
    resolvedTemplateId = template.id;
    resolutionReason = 'profile';
    logger.debug('Using profile template', {
      ...logContext,
      templateId: resolvedTemplateId,
    });
  } else {
    // Use default for plan
    template = defaultTemplateForPlan;
    resolvedTemplateId = template.id;
    resolutionReason = 'default';
    logger.debug('Using default template for plan', {
      ...logContext,
      templateId: resolvedTemplateId,
      planTier,
    });
  }

  return {
    template,
    templateId: resolvedTemplateId,
    resolutionReason,
    wasFallback,
  };
}
