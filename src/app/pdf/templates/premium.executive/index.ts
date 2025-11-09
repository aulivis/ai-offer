import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { premiumExecutiveTokens } from './tokens';

export const premiumExecutiveTemplate: OfferTemplate = {
  id: 'premium.executive@1.0.0',
  tier: 'premium',
  label: 'Executive',
  version: '1.0.0',
  marketingHighlight: 'Prémium dizájn logóval, dekoratív elemekkel és elegáns tipográfiával a legprofesszionálisabb ajánlatokhoz.',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: premiumExecutiveTokens,
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
    'gallery': true,
  },
  renderHead,
  renderBody,
};














