import { z } from 'zod';

import { freeMinimalHtmlTemplate } from './html/free.minimal';
import { premiumProfessionalHtmlTemplate } from './html/premium.professional';
import type { OfferTemplate, TemplateId, TemplateTier } from './types';

const renderFunctionSchema = z.custom<OfferTemplate['renderHead']>(
  (value) => typeof value === 'function',
  'must be a function',
);

const themeTokensSchema = z
  .object({
    color: z.object({
      primary: z.string(),
      secondary: z.string(),
      text: z.string(),
      muted: z.string(),
      border: z.string(),
      bg: z.string(),
    }),
    spacing: z.object({
      xs: z.string(),
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
    }),
    typography: z.object({
      body: z.string(),
      h1: z.string(),
      h2: z.string(),
      h3: z.string(),
      table: z.string(),
    }),
    radius: z.object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
    }),
  })
  .strict();

const templateStylesSchema = z
  .object({
    print: z.string().min(1, 'styles.print is required'),
    template: z.string().min(1, 'styles.template is required'),
  })
  .strict();

const offerTemplateSchema = z
  .object({
    id: z.string().min(1, 'id is required'),
    tier: z.union([z.literal('free'), z.literal('premium')]),
    label: z.string().min(1, 'label is required'),
    version: z.string().min(1, 'version is required'),
    renderHead: renderFunctionSchema,
    renderBody: renderFunctionSchema,
    styles: templateStylesSchema,
    tokens: themeTokensSchema,
    capabilities: z.record(z.string(), z.boolean()).optional(),
    marketingHighlight: z.string().optional(),
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

/**
 * Enhanced template metadata for UI and discovery
 */
export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  version: string;
  tier: TemplateTier;
  label: string;
  marketingHighlight?: string;
  description?: string;
  category?: string;
  tags?: string[];
  preview?: string;
  capabilities?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Template cache entry with metadata
 */
interface TemplateCacheEntry {
  template: OfferTemplate;
  metadata: TemplateMetadata;
  cachedAt: number;
}

// Template storage with caching
const templates = new Map<TemplateId, OfferTemplate>();
const legacyTemplates = new Map<string, OfferTemplate>();
const templateMetadata = new Map<TemplateId, TemplateMetadata>();
const templateCache = new Map<TemplateId, TemplateCacheEntry>();

const TEMPLATE_ALIAS_MAP: Record<string, TemplateId> = {};

// Cache TTL: 1 hour in milliseconds
const CACHE_TTL_MS = 60 * 60 * 1000;

function resolveTemplateAlias(id: TemplateId): TemplateId {
  return TEMPLATE_ALIAS_MAP[id] ?? id;
}

function formatValidationError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

/**
 * Extract metadata from template
 */
function extractTemplateMetadata(template: OfferTemplate): TemplateMetadata {
  const metadata: TemplateMetadata = {
    id: template.id,
    name: template.label,
    version: template.version,
    tier: template.tier,
    label: template.label,
    updatedAt: new Date().toISOString(),
  };

  const marketingHighlight = (template as { marketingHighlight?: string }).marketingHighlight;
  if (marketingHighlight) {
    metadata.marketingHighlight = marketingHighlight;
  }

  if (template.capabilities) {
    metadata.capabilities = template.capabilities;
  }

  return metadata;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: TemplateCacheEntry): boolean {
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

/**
 * Register a template with validation and caching
 */
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

  // Store template ID in legacy map for backward compatibility (allows lookup by template ID)
  legacyTemplates.set(template.id, template);

  // Register alias lookups for deprecated IDs pointing to this template
  for (const [alias, target] of Object.entries(TEMPLATE_ALIAS_MAP)) {
    if (target === template.id) {
      legacyTemplates.set(alias, template);
    }
  }

  // Store metadata
  const metadata = extractTemplateMetadata(template);
  templateMetadata.set(template.id, metadata);

  // Invalidate cache
  templateCache.delete(template.id);

  return template;
}

/**
 * List all templates with optional tier filtering
 */
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

/**
 * Get template metadata
 */
export function getTemplateMetadata(id: TemplateId): TemplateMetadata | null {
  const resolvedId = resolveTemplateAlias(id);
  return templateMetadata.get(resolvedId) ?? null;
}

/**
 * List all template metadata
 */
export function listTemplateMetadata({ tier }: { tier?: TemplateTier } = {}): TemplateMetadata[] {
  const allMetadata = Array.from(templateMetadata.values());

  if (!tier) {
    return allMetadata;
  }

  if (tier === 'premium') {
    return allMetadata;
  }

  return allMetadata.filter((meta) => meta.tier === tier);
}

/**
 * Load template with caching support
 */
export function loadTemplate(id: TemplateId): OfferTemplate {
  const resolvedId = resolveTemplateAlias(id);

  // Check cache first
  const cached = templateCache.get(resolvedId);
  if (cached && isCacheValid(cached)) {
    return cached.template;
  }

  // Load from registry
  const template = templates.get(resolvedId);

  if (!template) {
    throw new TemplateNotFoundError(id);
  }

  // Cache template
  const metadata = templateMetadata.get(resolvedId) ?? extractTemplateMetadata(template);
  templateCache.set(resolvedId, {
    template,
    metadata,
    cachedAt: Date.now(),
  });

  return template;
}

/**
 * Get template by legacy ID
 */
export function getOfferTemplateByLegacyId(legacyId: string): OfferTemplate {
  const resolvedId = resolveTemplateAlias(legacyId as TemplateId);
  const template =
    legacyTemplates.get(legacyId) ??
    legacyTemplates.get(resolvedId) ??
    templates.get(resolvedId as TemplateId);

  if (!template) {
    throw new TemplateNotFoundError(legacyId as TemplateId);
  }

  return template;
}

/**
 * Clear template cache (useful for testing or forced refresh)
 */
export function clearTemplateCache(id?: TemplateId): void {
  if (id) {
    templateCache.delete(resolveTemplateAlias(id));
  } else {
    templateCache.clear();
  }
}

/**
 * Update template metadata (for external metadata updates)
 */
export function updateTemplateMetadata(
  id: TemplateId,
  updates: Partial<Omit<TemplateMetadata, 'id' | 'version' | 'tier'>>,
): void {
  const resolvedId = resolveTemplateAlias(id);
  const existing = templateMetadata.get(resolvedId);
  if (!existing) {
    throw new TemplateNotFoundError(id);
  }

  templateMetadata.set(resolvedId, {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  // Invalidate cache
  templateCache.delete(resolvedId);
}

// Register built-in templates
const builtinTemplates = [
  freeMinimalHtmlTemplate,
  premiumProfessionalHtmlTemplate,
];

for (const template of builtinTemplates) {
  registerTemplate(template);
}
