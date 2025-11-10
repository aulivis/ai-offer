import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { freeMinimalTokens } from './tokens';

export const freeMinimalTemplate: OfferTemplate = {
  id: 'free.minimal@1.0.0',
  tier: 'free',
  label: 'MinimĂˇlis',
  version: '1.0.0',
  marketingHighlight:
    'Tiszta, professzionĂˇlis dizĂˇjn, amely tĂ¶kĂ©letesen megfelel az ĂĽzleti ajĂˇnlatokhoz.',
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
