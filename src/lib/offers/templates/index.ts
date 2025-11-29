/**
 * Template Registry
 *
 * Central registry for all offer templates.
 * This file imports and exports all templates for easy discovery and management.
 *
 * To add a new template:
 * 1. Create a new file in templates/{tier}/{name}.ts
 * 2. Export a render function
 * 3. Import it here
 * 4. Add it to the TEMPLATES registry
 */

import type { Template, TemplateId } from './types';

// Free templates
import { renderMinimal } from './free/minimal';
import { renderClassic } from './free/classic';
import { renderMinimalist } from './free/minimalist';

// Premium templates
import { renderProfessional } from './premium/professional';
import { renderLuxury } from './premium/luxury';
import { renderBrutalist } from './premium/brutalist';

/**
 * Template registry - all available templates
 *
 * Add new templates here as they're created.
 * The key must match the TemplateId type.
 */
export const TEMPLATES: Record<TemplateId, Template> = {
  'free.minimal': {
    id: 'free.minimal',
    name: 'Vera Minimal',
    tier: 'free',
    render: renderMinimal,
  },
  'free.classic': {
    id: 'free.classic',
    name: 'Viola Classic',
    tier: 'free',
    render: renderClassic,
  },
  'free.minimalist': {
    id: 'free.minimalist',
    name: 'Minimalist',
    tier: 'free',
    render: renderMinimalist,
  },
  'premium.professional': {
    id: 'premium.professional',
    name: 'Valeria Professional',
    tier: 'premium',
    render: renderProfessional,
  },
  'premium.luxury': {
    id: 'premium.luxury',
    name: 'Luxury',
    tier: 'premium',
    render: renderLuxury,
  },
  'premium.brutalist': {
    id: 'premium.brutalist',
    name: 'Brutalist',
    tier: 'premium',
    render: renderBrutalist,
  },
} as Record<TemplateId, Template>;

/**
 * Get template by ID
 *
 * @param id - Template ID (e.g., 'free.minimal')
 * @returns Template object or default template if not found
 */
export function getTemplate(id: TemplateId | string): Template {
  const template = TEMPLATES[id as TemplateId];
  if (!template) {
    // Fallback to default template
    return TEMPLATES['free.minimal'];
  }
  return template;
}

/**
 * Map old template IDs to new ones
 *
 * Supports backward compatibility with old template ID format
 * (e.g., 'free.minimal.html@1.0.0' -> 'free.minimal')
 */
export function mapTemplateId(oldId: string): TemplateId {
  const mapping: Record<string, TemplateId> = {
    'free.minimal.html@1.0.0': 'free.minimal',
    'free.classic.html@1.0.0': 'free.classic',
    'free.minimalist.html@1.0.0': 'free.minimalist',
    'premium.professional.html@1.0.0': 'premium.professional',
    'premium.luxury.html@1.0.0': 'premium.luxury',
    'premium.brutalist.html@1.0.0': 'premium.brutalist',
  };

  // If it's already in the new format, return as-is
  if (oldId in TEMPLATES) {
    return oldId as TemplateId;
  }

  // Try mapping from old format
  return mapping[oldId] || 'free.minimal';
}

/**
 * List all available templates
 */
export function listTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

/**
 * List templates by tier
 */
export function listTemplatesByTier(tier: 'free' | 'premium'): Template[] {
  return Object.values(TEMPLATES).filter((t) => t.tier === tier);
}

// Re-export types for convenience
export type { Template, TemplateId, TemplateContext } from './types';
