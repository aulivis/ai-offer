import type { OfferTemplate } from './types';

export class TemplateNotFoundError extends Error {
  constructor(public readonly templateId: string) {
    super(`Template with id "${templateId}" was not found.`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateRegistrationError';
  }
}

const registry = new Map<string, OfferTemplate>();

export function registerTemplate(template: OfferTemplate): OfferTemplate {
  if (registry.has(template.id)) {
    throw new TemplateRegistrationError(`Template "${template.id}" already registered.`);
  }
  registry.set(template.id, template);
  return template;
}

export function loadTemplate(id: string): OfferTemplate {
  const template = registry.get(id);
  if (!template) {
    throw new TemplateNotFoundError(id);
  }
  return template;
}

export function listTemplates(): OfferTemplate[] {
  return Array.from(registry.values());
}

export function clearTemplates() {
  registry.clear();
}
