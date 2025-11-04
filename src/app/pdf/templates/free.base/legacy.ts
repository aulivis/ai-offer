import type { OfferTemplate } from '../types';
import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { freeBaseTokens } from './tokens';

export const legacyFreeBaseTemplate: OfferTemplate & { legacyId: LegacyOfferTemplateId } = {
  id: 'free.base@1.1.0',
  legacyId: 'modern',
  tier: 'free',
  label: 'Modern minimal',
  version: '1.1.0',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: freeBaseTokens,
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
