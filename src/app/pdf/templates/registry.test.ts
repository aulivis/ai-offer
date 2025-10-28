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

  it('throws a typed error when loading an unknown template id', () => {
    expect(() => loadTemplate('unknown@1.0.0')).toThrow(TemplateNotFoundError);
  });

  it('loads templates by legacy id when available', () => {
    expect(getOfferTemplateByLegacyId('modern').id).toBe('free.base@1.0.0');
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
    });

    expect(loadTemplate(templateId)).toBe(template);
  });
});
