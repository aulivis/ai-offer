import { z } from 'zod';

import { modernTemplate } from './modern';
import { premiumBannerTemplate } from './premiumBanner';
import type { OfferTemplate, TemplateId, TemplateTier } from './types';

const renderFunctionSchema = z.custom<OfferTemplate['renderHead']>(
  (value) => typeof value === 'function',
  'must be a function',
);

const offerTemplateSchema = z
  .object({
    id: z.string().min(1, 'id is required'),
    tier: z.union([z.literal('free'), z.literal('premium')]),
    label: z.string().min(1, 'label is required'),
    version: z.string().min(1, 'version is required'),
    renderHead: renderFunctionSchema,
    renderBody: renderFunctionSchema,
    capabilities: z.record(z.string(), z.boolean()).optional(),
  })
  .passthrough();

export class TemplateRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateRegistryError';
  }
}

export class TemplateRegistrationError extends TemplateRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateRegistrationError';
  }
}

export class TemplateNotFoundError extends TemplateRegistryError {
  readonly templateId: TemplateId;

  constructor(templateId: TemplateId) {
    super(`Template with id "${templateId}" is not registered.`);
    this.name = 'TemplateNotFoundError';
    this.templateId = templateId;
  }
}

const templates = new Map<TemplateId, OfferTemplate>();

function formatValidationError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

export function registerTemplate(templateModule: unknown): OfferTemplate {
  const result = offerTemplateSchema.safeParse(templateModule);

  if (!result.success) {
    const templateId =
      typeof templateModule === 'object' && templateModule && 'id' in templateModule
        ? String((templateModule as { id?: unknown }).id ?? '<unknown>')
        : '<unknown>';
    throw new TemplateRegistrationError(
      `Failed to register template "${templateId}": ${formatValidationError(result.error)}`,
    );
  }

  const template = result.data as OfferTemplate;

  if (templates.has(template.id)) {
    throw new TemplateRegistrationError(
      `Failed to register template "${template.id}": template already registered.`,
    );
  }

  templates.set(template.id, template);

  return template;
}

export function listTemplates({ tier }: { tier?: TemplateTier } = {}): OfferTemplate[] {
  const allTemplates = Array.from(templates.values());
  return tier ? allTemplates.filter((template) => template.tier === tier) : allTemplates;
}

export function loadTemplate(id: TemplateId): OfferTemplate {
  const template = templates.get(id);

  if (!template) {
    throw new TemplateNotFoundError(id);
  }

  return template;
}

// Register built-in templates
const builtinTemplates = [modernTemplate, premiumBannerTemplate];

for (const template of builtinTemplates) {
  registerTemplate(template);
}
