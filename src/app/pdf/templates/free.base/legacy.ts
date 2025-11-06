import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { freeBaseTokens } from './tokens';

export const legacyFreeBaseTemplate: OfferTemplate = {
  id: 'free.base@1.1.0',
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
