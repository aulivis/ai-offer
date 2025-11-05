/**
 * SDK Runtime Template Registry
 * 
 * This registry provides a simplified interface for runtime PDF generation.
 * It uses the main engineRegistry as the backend while providing SDK-compatible types.
 */

import type { OfferTemplate } from '@/app/pdf/sdk/types';
import { minimalRuntimeTemplate } from '@/app/pdf/sdk/templates/minimal';
import { getTemplateMetadata as getEngineTemplateMetadata } from './engineRegistry';
import { loadTemplate as loadEngineTemplate } from './engineRegistry';
import type { TemplateId as EngineTemplateId } from './types';
import freeBaseTemplate from './free.base';
import { Template_pro_nordic } from './pro.nordic';

export type TemplateMeta = {
  id: string;
  name: string;
  version: string;
  capabilities?: string[];
  preview?: string;
  factory: () => OfferTemplate;
};

/**
 * Convert engine template to SDK template format
 */
function createSDKTemplateAdapter(engineTemplateId: EngineTemplateId): OfferTemplate | null {
  try {
    const engineTemplate = loadEngineTemplate(engineTemplateId);
    
    // For now, return null if it's not a runtime template
    // Runtime templates should be in SDK format
    return null;
  } catch {
    return null;
  }
}

const minimalTemplateMeta: TemplateMeta = {
  id: minimalRuntimeTemplate.id,
  name: minimalRuntimeTemplate.name,
  version: minimalRuntimeTemplate.version,
  ...(minimalRuntimeTemplate.capabilities && minimalRuntimeTemplate.capabilities.length > 0
    ? { capabilities: minimalRuntimeTemplate.capabilities }
    : {}),
  factory: () => ({ ...minimalRuntimeTemplate }),
};

const freeBaseTemplateMeta: TemplateMeta = {
  id: freeBaseTemplate.id,
  name: freeBaseTemplate.name,
  version: freeBaseTemplate.version,
  ...(freeBaseTemplate.capabilities && freeBaseTemplate.capabilities.length > 0
    ? { capabilities: freeBaseTemplate.capabilities }
    : {}),
  factory: () => ({ ...freeBaseTemplate }),
};

export const TEMPLATE_REGISTRY: TemplateMeta[] = [freeBaseTemplateMeta, minimalTemplateMeta];

TEMPLATE_REGISTRY.push({
  id: 'pro.nordic',
  name: 'Nordic Professional',
  version: '1.0.0',
  capabilities: ['gallery', 'long-items'],
  preview: '/pdf/preview?templateId=pro.nordic&brandPrimary=%230EA5E9&brandSecondary=%23111827',
  factory: () => Template_pro_nordic,
});

/**
 * Get template metadata by ID
 */
export function getTemplateMeta(id: string): TemplateMeta | null {
  // First check SDK registry
  const sdkMeta = TEMPLATE_REGISTRY.find((t) => t.id === id);
  if (sdkMeta) {
    return sdkMeta;
  }

  // Fallback to engine registry
  const engineMeta = getEngineTemplateMetadata(id as EngineTemplateId);
  if (engineMeta) {
    // Convert engine template metadata to SDK format
    const meta: TemplateMeta = {
      id: engineMeta.id,
      name: engineMeta.name,
      version: engineMeta.version,
      factory: () => {
        const adapter = createSDKTemplateAdapter(id as EngineTemplateId);
        if (adapter) {
          return adapter;
        }
        // Fallback to minimal template if conversion fails
        return minimalRuntimeTemplate;
      },
    };

    if (engineMeta.preview) {
      meta.preview = engineMeta.preview;
    }

    if (engineMeta.capabilities) {
      const capabilityKeys = Object.keys(engineMeta.capabilities).filter(
        (k) => engineMeta.capabilities?.[k],
      );
      if (capabilityKeys.length > 0) {
        meta.capabilities = capabilityKeys;
      }
    }

    return meta;
  }

  return null;
}

/**
 * List all templates
 */
export function listTemplates(): TemplateMeta[] {
  return TEMPLATE_REGISTRY;
}
