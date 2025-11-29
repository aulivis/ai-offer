import { getTemplate, mapTemplateId, listTemplates } from '@/lib/offers/templates/index';
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
  templateId: string; // HTML template ID
  resolutionReason: 'requested' | 'profile' | 'default' | 'fallback';
  wasFallback: boolean;
}

function planToTemplateTier(plan: SubscriptionPlan): 'free' | 'premium' {
  return plan === 'pro' ? 'premium' : 'free';
}

/**
 * Resolves the appropriate HTML template for an offer based on:
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
  const allTemplates = listTemplates();

  // Get fallback template ID (map old ID to new HTML template ID)
  const fallbackTemplateId = mapTemplateId(DEFAULT_OFFER_TEMPLATE_ID);
  const fallbackTemplate = getTemplate(fallbackTemplateId);

  const freeTemplates = allTemplates.filter((tpl) => tpl.tier === 'free');
  const defaultTemplateForPlan =
    planTier === 'premium'
      ? allTemplates.find((t) => t.tier === 'premium') || fallbackTemplate
      : freeTemplates[0] || fallbackTemplate;

  // Normalize and resolve requested template ID
  const normalizedRequestedId = requestedTemplateId
    ? normalizeTemplateId(requestedTemplateId)
    : null;

  // Try to find the requested template
  let requestedTemplateIdResolved: string | null = null;
  if (normalizedRequestedId) {
    try {
      // Map old PDF template ID to new HTML template ID
      const htmlTemplateId = mapTemplateId(normalizedRequestedId);
      const template = getTemplate(htmlTemplateId);

      // Check if template is allowed for plan
      if (planTier === 'premium' || template.tier === 'free') {
        requestedTemplateIdResolved = htmlTemplateId;
      }
    } catch (error) {
      logger.warn('Requested template not found, will fall back', {
        ...logContext,
        requestedTemplateId: normalizedRequestedId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Get profile template
  const normalizedProfileId = profileTemplateId ? normalizeTemplateId(profileTemplateId) : null;
  let profileTemplateIdResolved: string | null = null;
  if (normalizedProfileId) {
    try {
      const htmlTemplateId = mapTemplateId(normalizedProfileId);
      const template = getTemplate(htmlTemplateId);

      if (planTier === 'premium' || template.tier === 'free') {
        profileTemplateIdResolved = htmlTemplateId;
      }
    } catch (error) {
      logger.warn('Profile template not found, will fall back', {
        ...logContext,
        profileTemplateId: normalizedProfileId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Resolve final template with proper fallback chain
  let resolvedTemplateId: string;
  let resolutionReason: ResolvedTemplate['resolutionReason'];
  let wasFallback = false;

  if (requestedTemplateIdResolved) {
    // Use requested template if allowed
    resolvedTemplateId = requestedTemplateIdResolved;
    resolutionReason = 'requested';
    logger.debug('Using requested template', {
      ...logContext,
      templateId: resolvedTemplateId,
    });
  } else if (requestedTemplateId && normalizedRequestedId) {
    // Requested template not allowed for plan, use fallback
    resolvedTemplateId = fallbackTemplateId;
    resolutionReason = 'fallback';
    wasFallback = true;
    logger.warn('Requested template not allowed for plan, using fallback', {
      ...logContext,
      requestedTemplateId: normalizedRequestedId,
      planTier,
      fallbackTemplateId: resolvedTemplateId,
    });
  } else if (profileTemplateIdResolved) {
    // Use profile template if allowed
    resolvedTemplateId = profileTemplateIdResolved;
    resolutionReason = 'profile';
    logger.debug('Using profile template', {
      ...logContext,
      templateId: resolvedTemplateId,
    });
  } else {
    // Use default for plan
    resolvedTemplateId = defaultTemplateForPlan.id;
    resolutionReason = 'default';
    logger.debug('Using default template for plan', {
      ...logContext,
      templateId: resolvedTemplateId,
      planTier,
    });
  }

  return {
    templateId: resolvedTemplateId,
    resolutionReason,
    wasFallback,
  };
}
