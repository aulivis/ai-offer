import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { freeMinimalTokens } from './tokens';

export const freeMinimalTemplate: OfferTemplate = {
  id: 'free.minimal@1.0.0',
  tier: 'free',
  label: 'Minimális',
  version: '1.0.0',
  marketingHighlight: 'Tiszta, professzionális dizájn, amely tökéletesen megfelel az üzleti ajánlatokhoz.',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: freeMinimalTokens,
  capabilities: {
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};







