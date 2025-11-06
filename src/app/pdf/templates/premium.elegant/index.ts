import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { premiumElegantTokens } from './tokens';

export const premiumElegantTemplate: OfferTemplate = {
  id: 'premium.elegant@1.1.0',
  tier: 'premium',
  label: 'Prémium szalagos',
  version: '1.1.0',
  marketingHighlight: 'Elegáns, logóval testreszabható dizájn a profi ajánlatokhoz.',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: premiumElegantTokens,
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
