import { z } from 'zod';

import { freeBaseTemplate } from './free.base';
import { premiumElegantTemplate } from './premium.elegant';
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
const legacyTemplates = new Map<string, OfferTemplate>();

function extractLegacyId(template: unknown): string | null {
  if (typeof template !== 'object' || !template) {
    return null;
  }

  const candidate = (template as { legacyId?: unknown }).legacyId;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null;
}

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

  if (legacyTemplates.has(template.id)) {
    throw new TemplateRegistrationError(
      `Failed to register template "${template.id}": template already registered.`,
    );
  }

  templates.set(template.id, template);

  const legacyId = extractLegacyId(template);
  if (legacyId) {
    if (legacyTemplates.has(legacyId)) {
      throw new TemplateRegistrationError(
        `Failed to register template "${template.id}": legacy id "${legacyId}" already registered.`,
      );
    }
    legacyTemplates.set(legacyId, template);
  }

  legacyTemplates.set(template.id, template);

  return template;
}

export function listTemplates({ tier }: { tier?: TemplateTier } = {}): OfferTemplate[] {
  const allTemplates = Array.from(templates.values());

  if (!tier) {
    return allTemplates;
  }

  if (tier === 'premium') {
    return allTemplates;
  }

  return allTemplates.filter((template) => template.tier === tier);
}

export function loadTemplate(id: TemplateId): OfferTemplate {
  const template = templates.get(id);

  if (!template) {
    throw new TemplateNotFoundError(id);
  }

  return template;
}

export function getOfferTemplateByLegacyId(legacyId: string): OfferTemplate {
  const template = legacyTemplates.get(legacyId) ?? templates.get(legacyId as TemplateId);

  if (!template) {
    throw new TemplateNotFoundError(legacyId as TemplateId);
  }

  return template;
}

// Register built-in templates
const builtinTemplates = [freeBaseTemplate, premiumElegantTemplate];

for (const template of builtinTemplates) {
  registerTemplate(template);
}
