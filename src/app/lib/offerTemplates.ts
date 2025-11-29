import type { TemplateId } from '@/lib/offers/templates/types';
import { getTemplate, mapTemplateId } from '@/lib/offers/templates/index';

export type SubscriptionPlan = 'free' | 'standard' | 'pro';

// Default template ID using the new HTML template system
export const DEFAULT_OFFER_TEMPLATE_ID: string = 'free.minimal';

// Legacy ID mappings for backward compatibility during migration
const LEGACY_ID_MAP: Record<string, string> = {
  modern: 'free.minimal',
  'free.base': 'free.minimal',
  'free.minimal.html@1.0.0': 'free.minimal',
  'free.classic.html@1.0.0': 'free.classic',
  'free.minimalist.html@1.0.0': 'free.minimalist',
  'premium.professional.html@1.0.0': 'premium.professional',
  'premium.luxury.html@1.0.0': 'premium.luxury',
  'premium.brutalist.html@1.0.0': 'premium.brutalist',
  'premium-banner': 'premium.professional',
  premium: 'premium.professional',
  premium_banner: 'premium.professional',
  'premium.elegant': 'premium.professional',
  'premium.modern': 'premium.professional',
};

/**
 * Convert legacy template ID to new HTML template ID
 */
export function normalizeTemplateId(id: string | null | undefined): TemplateId {
  if (!id) {
    return mapTemplateId(DEFAULT_OFFER_TEMPLATE_ID);
  }

  // Check legacy ID mapping first
  if (LEGACY_ID_MAP[id]) {
    return mapTemplateId(LEGACY_ID_MAP[id]);
  }

  // Try to map using the template system's mapTemplateId
  try {
    return mapTemplateId(id);
  } catch {
    // Fallback to default
    return mapTemplateId(DEFAULT_OFFER_TEMPLATE_ID);
  }
}

/**
 * Check if a template requires pro plan
 */
export function templateRequiresPro(templateId: TemplateId): boolean {
  try {
    const template = getTemplate(templateId);
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
    return mapTemplateId(DEFAULT_OFFER_TEMPLATE_ID);
  }

  return normalizedId;
}

/**
 * Get template tier for a given plan
 */
export function planToTemplateTier(plan: SubscriptionPlan): 'free' | 'premium' {
  return plan === 'pro' ? 'premium' : 'free';
}
