import { describe, expect, it } from 'vitest';

import {
  TemplateNotFoundError,
  TemplateRegistrationError,
  listTemplates,
  loadTemplate,
  getOfferTemplateByLegacyId,
  registerTemplate,
} from './registry';

describe('template registry', () => {
  it('filters templates by tier', () => {
    const freeTemplates = listTemplates({ tier: 'free' });

    expect(freeTemplates.length).toBeGreaterThan(0);
    expect(freeTemplates.every((template) => template.tier === 'free')).toBe(true);
  });

  it('returns all templates for premium tier', () => {
    const premiumTemplates = listTemplates({ tier: 'premium' });
    const allTemplates = listTemplates();

    expect(premiumTemplates.length).toBe(allTemplates.length);
    expect(premiumTemplates.some((template) => template.tier === 'free')).toBe(true);
    expect(premiumTemplates.some((template) => template.tier === 'premium')).toBe(true);
  });

  it('throws a typed error when loading an unknown template id', () => {
    expect(() => loadTemplate('unknown@1.0.0')).toThrow(TemplateNotFoundError);
  });

  it('loads templates by legacy id when available', () => {
    expect(getOfferTemplateByLegacyId('modern').id).toBe('free.base@1.1.0');
  });

  it('validates templates during registration', () => {
    expect(() => registerTemplate({})).toThrow(TemplateRegistrationError);
  });

  it('registers additional templates when valid', () => {
    const templateId = `test-template@${Date.now()}`;

    const template = registerTemplate({
      id: templateId,
      tier: 'free',
      label: 'Test template',
      version: '1.0.0',
      renderHead: () => '<head></head>',
      renderBody: () => '<main></main>',
      styles: {
        print: '@page{size:A4;}',
        template: '.offer-doc{}',
      },
      tokens: {
        color: {
          primary: '#000000',
          secondary: '#ffffff',
          text: '#111111',
          muted: '#222222',
          border: '#333333',
          bg: '#ffffff',
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
        typography: {
          body: "400 1rem/1.5 'Work Sans'",
          h1: "700 2rem/1.2 'Work Sans'",
          h2: "600 1.5rem/1.3 'Work Sans'",
          h3: "600 1.25rem/1.3 'Work Sans'",
          table: "600 0.875rem/1.2 'Work Sans'",
        },
        radius: {
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
        },
      },
    });

    expect(loadTemplate(templateId)).toBe(template);
  });
});
