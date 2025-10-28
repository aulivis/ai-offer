import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';

import { modernTemplate } from './modern';
import { premiumBannerTemplate } from './premiumBanner';
import type { OfferTemplate, TemplateId } from './types';

export type RegisteredOfferTemplate = OfferTemplate & { legacyId: LegacyOfferTemplateId };

const REGISTERED_TEMPLATES: RegisteredOfferTemplate[] = [modernTemplate, premiumBannerTemplate];

const BY_ID = new Map<TemplateId, RegisteredOfferTemplate>();
const BY_LEGACY_ID = new Map<LegacyOfferTemplateId, RegisteredOfferTemplate>();

for (const template of REGISTERED_TEMPLATES) {
  BY_ID.set(template.id, template);
  BY_LEGACY_ID.set(template.legacyId, template);
}

export function getOfferTemplateById(id: TemplateId): RegisteredOfferTemplate {
  return BY_ID.get(id) ?? modernTemplate;
}

export function getOfferTemplateByLegacyId(id: LegacyOfferTemplateId): RegisteredOfferTemplate {
  return BY_LEGACY_ID.get(id) ?? modernTemplate;
}

export function listOfferTemplates(): RegisteredOfferTemplate[] {
  return [...REGISTERED_TEMPLATES];
}
