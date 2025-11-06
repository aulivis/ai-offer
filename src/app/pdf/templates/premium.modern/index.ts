import type { OfferTemplate } from '../types';

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { premiumModernTokens } from './tokens';

export const premiumModernTemplate: OfferTemplate = {
  id: 'premium.modern@1.0.0',
  tier: 'premium',
  label: 'Modern Professional',
  version: '1.0.0',
  marketingHighlight: 'Modern, clean design perfect for professional business offers with gradient header and refined typography.',
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: premiumModernTokens,
  capabilities: {
    'branding.logo': true,
    'branding.colors': true,
    'pricing.table': true,
    'gallery': true,
  },
  renderHead,
  renderBody,
};




