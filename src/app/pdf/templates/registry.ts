import type { OfferTemplate } from '@/app/pdf/sdk/types';
import { minimalRuntimeTemplate } from '@/app/pdf/sdk/templates/minimal';

export type TemplateMeta = {
  id: string;
  name: string;
  version: string;
  capabilities?: string[];
  // relative preview image path or generator fn later
  preview?: string;
  factory: () => OfferTemplate;
};

const minimalTemplateMeta: TemplateMeta = {
  id: minimalRuntimeTemplate.id,
  name: minimalRuntimeTemplate.name,
  version: minimalRuntimeTemplate.version,
  capabilities: minimalRuntimeTemplate.capabilities,
  factory: () => ({ ...minimalRuntimeTemplate }),
};

export const TEMPLATE_REGISTRY: TemplateMeta[] = [minimalTemplateMeta];

export function getTemplateMeta(id: string) {
  return TEMPLATE_REGISTRY.find((t) => t.id === id) || null;
}
export function listTemplates() {
  return TEMPLATE_REGISTRY;
}
