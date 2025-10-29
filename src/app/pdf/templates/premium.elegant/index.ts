import type { OfferTemplate } from '../types';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { premiumElegantTokens } from './tokens';

export const premiumElegantTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'premium.elegant@1.1.0',
  legacyId: 'premium-banner',
  tier: 'premium',
  label: 'Prémium szalagos',
  version: '1.1.0',
  marketingHighlight: 'Elegáns, logóval testreszabható dizájn a profi ajánlatokhoz.',
  tokens: premiumElegantTokens,
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
