export type SubscriptionPlan = 'free' | 'standard' | 'pro';

export const OFFER_TEMPLATES = [
  {
    id: 'modern',
    label: 'Modern minimal',
    description: 'Letisztult, jól olvasható struktúra finom színkiemeléssel.',
    access: 'all' as const,
    previewVariant: 'modern',
  },
  {
    id: 'premium-banner',
    label: 'Prémium szalagos',
    description: 'Színes fejléccel és kártyás elrendezéssel emeli ki a márkádat.',
    access: 'pro' as const,
    previewVariant: 'premium',
  },
] as const;

export type OfferTemplateDefinition = (typeof OFFER_TEMPLATES)[number];
export type OfferTemplateId = OfferTemplateDefinition['id'];

export const DEFAULT_OFFER_TEMPLATE_ID: OfferTemplateId = 'modern';

export function isOfferTemplateId(value: unknown): value is OfferTemplateId {
  return OFFER_TEMPLATES.some((template) => template.id === value);
}

export function offerTemplateRequiresPro(id: OfferTemplateId): boolean {
  const template = OFFER_TEMPLATES.find((item) => item.id === id);
  return template?.access === 'pro';
}

export function enforceTemplateForPlan(
  requested: string | null | undefined,
  plan: SubscriptionPlan,
): OfferTemplateId {
  if (!isOfferTemplateId(requested)) {
    return DEFAULT_OFFER_TEMPLATE_ID;
  }
  if (offerTemplateRequiresPro(requested) && plan !== 'pro') {
    return DEFAULT_OFFER_TEMPLATE_ID;
  }
  return requested;
}

export function getOfferTemplateDefinition(id: OfferTemplateId): OfferTemplateDefinition {
  const template = OFFER_TEMPLATES.find((item) => item.id === id);
  if (!template) {
    return OFFER_TEMPLATES[0];
  }
  return template;
}
