import type { OfferTemplate } from '../types';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';

export const freeBaseTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'free.base@1.0.0',
  legacyId: 'modern',
  tier: 'free',
  label: 'Modern minimal',
  version: '1.0.0',
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
