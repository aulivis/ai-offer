import type { OfferTemplate } from '../types';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';

export const premiumElegantTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'premium.elegant@1.0.0',
  legacyId: 'premium-banner',
  tier: 'premium',
  label: 'Prémium szalagos',
  version: '1.0.0',
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
