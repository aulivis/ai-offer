import { NextResponse } from 'next/server';

import { listTemplateMetadata } from '@/app/pdf/templates/engineRegistry';
import { listTemplates } from '@/app/pdf/templates/registry';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';

/**
 * GET /api/templates
 *
 * Returns list of available PDF templates with metadata.
 * Supports both SDK runtime templates and engine templates.
 */
export function GET() {
  // Get SDK templates (for runtime export)
  const sdkTemplates = listTemplates().map((template) => {
    const { factory, ...meta } = template;
    return meta;
  });

  // Get engine templates (for production use)
  const engineTemplates = listTemplateMetadata().map((meta) => ({
    id: meta.id,
    name: meta.name,
    version: meta.version,
    tier: meta.tier,
    label: meta.label,
    marketingHighlight: meta.marketingHighlight,
    capabilities: meta.capabilities,
    preview: meta.preview,
    description: meta.description,
    category: meta.category,
    tags: meta.tags,
  }));

  // Combine and deduplicate by ID
  const allTemplates = new Map<string, (typeof engineTemplates)[0]>();

  // Add engine templates first (production templates)
  for (const template of engineTemplates) {
    allTemplates.set(template.id, template);
  }

  // Add SDK templates (may override if same ID)
  for (const template of sdkTemplates) {
    if (!allTemplates.has(template.id)) {
      const sdkMeta: (typeof engineTemplates)[0] = {
        id: template.id,
        name: template.name,
        version: template.version,
        tier: 'free', // SDK templates default to free
        label: template.name,
        capabilities: template.capabilities
          ? Object.fromEntries(template.capabilities.map((c) => [c, true]))
          : undefined,
        preview: template.preview,
        marketingHighlight: undefined,
        description: undefined,
        category: undefined,
        tags: undefined,
      };
      allTemplates.set(template.id, sdkMeta);
    }
  }

  const response = NextResponse.json(Array.from(allTemplates.values()));
  return addCacheHeaders(response, CACHE_CONFIGS.PUBLIC_STABLE);
}
