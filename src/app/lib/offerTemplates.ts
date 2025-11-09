import type { TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import {
  listTemplateMetadata,
  getOfferTemplateByLegacyId,
  loadTemplate,
} from '@/app/pdf/templates/engineRegistry';

export type SubscriptionPlan = 'free' | 'standard' | 'pro';

// Default template ID using the new template system
export const DEFAULT_OFFER_TEMPLATE_ID: TemplateId = 'free.minimal@1.0.0';

// Legacy ID mappings for backward compatibility during migration
const LEGACY_ID_MAP: Record<string, TemplateId> = {
  modern: 'free.minimal@1.0.0',
  'free.base': 'free.minimal@1.0.0',
  'premium-banner': 'premium.executive@1.0.0',
  premium: 'premium.executive@1.0.0',
  premium_banner: 'premium.executive@1.0.0',
  'premium.elegant': 'premium.executive@1.0.0',
  'premium.modern': 'premium.executive@1.0.0',
};

/**
 * Convert legacy template ID to new template ID
 */
export function normalizeTemplateId(id: string | null | undefined): TemplateId {
  if (!id) {
    return DEFAULT_OFFER_TEMPLATE_ID;
  }

  // Check if it's already a new template ID (contains @)
  if (id.includes('@')) {
    return id as TemplateId;
  }

  // Check legacy ID mapping
  if (LEGACY_ID_MAP[id]) {
    return LEGACY_ID_MAP[id];
  }

  // Try to load by legacy ID (for templates that still have legacyId property)
  try {
    const template = getOfferTemplateByLegacyId(id);
    return template.id;
  } catch {
    // Fallback to default
    return DEFAULT_OFFER_TEMPLATE_ID;
  }
}

/**
 * Check if a template requires pro plan
 */
export function templateRequiresPro(templateId: TemplateId): boolean {
  try {
    const template = loadTemplate(templateId);
    return template.tier === 'premium';
  } catch {
    return false;
  }
}

/**
 * Enforce template access based on plan
 */
export function enforceTemplateForPlan(
  requested: string | null | undefined,
  plan: SubscriptionPlan,
): TemplateId {
  const normalizedId = normalizeTemplateId(requested);

  // If template requires pro and user doesn't have pro plan, use default
  if (templateRequiresPro(normalizedId) && plan !== 'pro') {
    return DEFAULT_OFFER_TEMPLATE_ID;
  }

  return normalizedId;
}

/**
 * Get template tier for a given plan
 */
export function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}
