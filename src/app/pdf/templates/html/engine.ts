import { sanitizeInput } from '@/lib/sanitize';
import { summarize } from '@/app/lib/pricing';
import type { PriceRow } from '@/app/lib/pricing';
import type { RenderCtx } from '../types';
import { buildHeaderFooterCtx } from '../shared/headerFooter';
import { getPreloadedTemplateHtml } from '../templatePreloader';
import { logger } from '@/lib/logger';

/**
 * Simple template engine for HTML templates
 * Supports:
 * - {{variable}} for simple replacements
 * - {{#if variable}}...{{/if}} for conditionals
 * - {{#each array}}...{{/each}} for loops
 * - {{{variable}}} for unescaped HTML (use with caution)
 */
export class HtmlTemplateEngine {
  private template: string;

  constructor(template: string) {
    this.template = template;
  }

  render(data: Record<string, unknown>): string {
    let result = this.template;

    // Validate template has content
    if (!result || result.trim().length === 0) {
      logger.warn('Empty template provided to HtmlTemplateEngine');
      return '';
    }

    // Process recursively until no more changes occur (handles nested conditionals/loops)
    let previousResult: string;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    do {
      previousResult = result;

      // Handle loops first (they may contain conditionals)
      result = this.processLoops(result, data);

      // Handle conditionals (may be nested)
      result = this.processConditionals(result, data);

      // Handle unescaped HTML {{{var}}}
      result = this.processUnescapedVariables(result, data);

      // Handle regular variables {{var}}
      result = this.processVariables(result, data);

      iterations++;
    } while (result !== previousResult && iterations < maxIterations);

    // Warn if we hit max iterations (potential infinite loop or complex nesting)
    if (iterations >= maxIterations && result !== previousResult) {
      logger.warn(
        'Template processing hit max iterations - may have unresolved template variables',
        {
          remainingVariables: this.detectRemainingVariables(result),
        },
      );
    }

    // Remove HTML comments (including multi-line comments)
    // Match <!-- ... --> with any content including newlines
    result = result.replace(/<!--[\s\S]*?-->/gm, '');

    // Remove any remaining standalone comment markers that might have been left
    result = result.replace(/<!--/g, '').replace(/-->/g, '');

    return result;
  }

  /**
   * Detect remaining unresolved template variables for debugging
   * @internal - Used for error reporting and debugging
   */
  detectRemainingVariables(template: string): string[] {
    const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    const unescapedRegex = /\{\{\{(\w+(?:\.\w+)*)\}\}\}/g;
    const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g;
    const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}/g;

    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = varRegex.exec(template)) !== null) {
      variables.add(match[1]!);
    }
    while ((match = unescapedRegex.exec(template)) !== null) {
      variables.add(match[1]!);
    }
    while ((match = ifRegex.exec(template)) !== null) {
      variables.add(match[1]!);
    }
    while ((match = eachRegex.exec(template)) !== null) {
      variables.add(match[1]!);
    }

    return Array.from(variables);
  }

  private processConditionals(template: string, data: Record<string, unknown>): string {
    // Match {{#if variable}}...{{/if}} with support for nested conditionals
    // Use non-greedy matching and handle nested braces
    const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    let result = template;
    let changed = true;
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    // Process conditionals iteratively to handle nested ones
    while (changed && iterations < maxIterations) {
      const before = result;
      result = result.replace(ifRegex, (match, varName, content) => {
        const value = this.getNestedValue(data, varName);
        if (this.isTruthy(value)) {
          return content;
        }
        return '';
      });
      changed = result !== before;
      iterations++;
    }

    return result;
  }

  private processLoops(template: string, data: Record<string, unknown>): string {
    const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    return template.replace(eachRegex, (match, varName, content) => {
      const array = this.getNestedValue(data, varName);
      if (!Array.isArray(array)) {
        return '';
      }
      return array
        .map((item, index) => {
          // Create a new data context with the item's properties
          // For array items, use 'this' to refer to the current item
          // If item is a string, make it available as 'this'
          // If item is an object, spread its properties and also make it available as 'this'
          const itemData: Record<string, unknown> = {
            ...data,
            '@index': index,
            '@first': index === 0,
            '@last': index === array.length - 1,
          };

          if (typeof item === 'string') {
            itemData.this = item;
          } else if (typeof item === 'object' && item !== null) {
            // Spread object properties
            Object.assign(itemData, item);
            // Also make the whole object available as 'this'
            itemData.this = item;
          } else {
            itemData.this = item;
          }

          // Process nested conditionals and variables in the loop content
          let itemContent = content;
          // Recursively process nested structures
          itemContent = this.processConditionals(itemContent, itemData);
          itemContent = this.processUnescapedVariables(itemContent, itemData);
          itemContent = this.processVariables(itemContent, itemData);
          return itemContent;
        })
        .join('');
    });
  }

  private processUnescapedVariables(template: string, data: Record<string, unknown>): string {
    // Support nested property access like {{{user.name}}}
    const unescapedRegex = /\{\{\{(\w+(?:\.\w+)*)\}\}\}/g;
    return template.replace(unescapedRegex, (match, varName) => {
      const value = this.getNestedValue(data, varName);
      return value != null ? String(value) : '';
    });
  }

  private processVariables(template: string, data: Record<string, unknown>): string {
    // Support nested property access like {{user.name}}
    const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    return template.replace(varRegex, (match, varName) => {
      const value = this.getNestedValue(data, varName);
      // Sanitize all regular variable outputs for security
      return value != null ? sanitizeInput(String(value)) : '';
    });
  }

  private getNestedValue(data: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = data;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  }

  private isTruthy(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }
}

/**
 * Color utility functions for template rendering
 */

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return '0 0% 50%'; // Default gray
  }

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

/**
 * Split HSL string into components
 */
function splitHslComponents(hsl: string): { h: string; s: string; l: string } {
  const parts = hsl
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return {
    h: parts[0] ?? '0',
    s: parts[1] ?? '0%',
    l: parts[2] ?? '0%',
  };
}

/**
 * Normalize hex color (ensure it has # prefix and valid format)
 */
function normalizeHexColor(hex: string | null | undefined): string {
  if (!hex || typeof hex !== 'string') {
    return '#1a1a1a'; // Default fallback
  }
  const trimmed = hex.trim();
  if (!trimmed) {
    return '#1a1a1a';
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

const ColorUtils = {
  hexToHsl,
  splitHslComponents,
  normalizeHexColor,
};

/**
 * Formatting utilities for template rendering
 */

/**
 * Format currency for Hungarian locale
 */
function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return '0 Ft';
  }
  return `${value.toLocaleString('hu-HU')} Ft`;
}

/**
 * Format number for Hungarian locale
 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString('hu-HU');
}

/**
 * Format date for Hungarian locale
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString || typeof dateString !== 'string') {
    return '';
  }
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const FormatUtils = {
  formatCurrency,
  formatNumber,
  formatDate,
};

/**
 * Terms parsing utilities
 */

/**
 * Parse terms text into structured items if it contains numbered list format
 * Example: "1. Title\nDescription text\n2. Another title\nMore text"
 */
function parseTermsText(
  termsText: string | null | undefined,
): Array<{ number: number; title: string; description: string }> {
  if (!termsText || typeof termsText !== 'string') {
    return [];
  }

  const items: Array<{ number: number; title: string; description: string }> = [];
  const lines = termsText.split('\n').filter((line) => line.trim().length > 0);
  let currentItem: { number: number; title: string; description: string } | null = null;

  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (numberedMatch) {
      // Save previous item if exists
      if (currentItem) {
        items.push(currentItem);
      }
      // Start new item
      const number = parseInt(numberedMatch[1]!, 10);
      if (Number.isFinite(number)) {
        currentItem = {
          number,
          title: numberedMatch[2]!.trim(),
          description: '',
        };
      }
    } else if (currentItem) {
      // Append to current item's description
      currentItem.description += (currentItem.description ? ' ' : '') + line.trim();
    }
  }

  // Don't forget the last item
  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}

const TermsUtils = {
  parseTermsText,
};

/**
 * Pricing utilities for template rendering
 */

/**
 * Prepare pricing rows data for template
 * Matches the structure expected by the HTML template
 * The "Összesen" (Total) column shows gross total (with VAT) to match the example
 */
function preparePricingRows(rows: PriceRow[]): Array<{
  name: string;
  qty: string;
  unitPrice: string;
  vat: string;
  total: string;
}> {
  return rows.map((row) => {
    const qty = Number.isFinite(row.qty) ? (row.qty ?? 0) : 0;
    const unitPrice = Number.isFinite(row.unitPrice) ? (row.unitPrice ?? 0) : 0;
    const vatPct = Number.isFinite(row.vat) ? (row.vat ?? 0) : 0;
    const lineNet = qty * unitPrice;
    const lineVat = lineNet * (vatPct / 100);
    const lineGross = lineNet + lineVat;
    const name = typeof row.name === 'string' ? row.name : '';

    return {
      name,
      qty: FormatUtils.formatNumber(qty),
      // Format as "150.000 Ft"
      unitPrice: FormatUtils.formatCurrency(unitPrice),
      vat: FormatUtils.formatNumber(vatPct),
      // Total is the gross total (net + VAT) to match the example
      total: FormatUtils.formatCurrency(lineGross),
    };
  });
}

const PricingUtils = {
  preparePricingRows,
};

/**
 * Load HTML template from file
 * Only works on server-side (uses fs module)
 * Uses pre-loaded cache if available for better performance
 */
export function loadHtmlTemplate(templatePath: string): string {
  // Only load on server-side (Node.js environment)
  // Check for process instead of window for better Node.js detection
  if (typeof process === 'undefined' || !process.versions?.node) {
    throw new Error('loadHtmlTemplate can only be called on the server');
  }

  // Try to get from pre-loaded cache first
  try {
    const filename = templatePath.split('/').pop() || templatePath.split('\\').pop();
    if (filename) {
      const cached = getPreloadedTemplateHtml(filename);
      if (cached) {
        return cached;
      }
    }
  } catch {
    // Pre-loader not available or template not cached, fall back to file system
  }

  try {
    // Use dynamic require to avoid bundling fs in client builds
    // This is safe because the function already checks for Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('fs');
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load HTML template from ${templatePath}: ${error}`);
  }
}

/**
 * Render HTML template with offer data
 *
 * This is the unified template rendering function used throughout the application.
 * All offer HTML should be generated through this function or buildOfferHtml.
 *
 * @param ctx - Render context with offer data, pricing rows, branding, etc.
 * @param templatePath - Path to the HTML template file
 * @returns Complete HTML document as string
 * @throws Error if template cannot be loaded or rendered
 */
export function renderHtmlTemplate(ctx: RenderCtx, templatePath: string): string {
  let templateContent: string;
  try {
    templateContent = loadHtmlTemplate(templatePath);
  } catch (error) {
    logger.error('Failed to load HTML template', error, { templatePath });
    throw new Error(
      `Failed to load template from ${templatePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!templateContent || templateContent.trim().length === 0) {
    logger.error('Template file is empty', undefined, { templatePath });
    throw new Error(`Template file is empty: ${templatePath}`);
  }

  const engine = new HtmlTemplateEngine(templateContent);
  const safeCtx = buildHeaderFooterCtx(ctx);

  // Prepare brand colors
  const primaryColor = ctx.branding?.primaryColor || ctx.tokens.color.primary;
  const secondaryColor = ctx.branding?.secondaryColor || ctx.tokens.color.secondary;
  const primaryColorHex = ColorUtils.normalizeHexColor(primaryColor);
  const secondaryColorHex = ColorUtils.normalizeHexColor(secondaryColor);
  const primaryColorHsl = ColorUtils.hexToHsl(primaryColorHex);
  const secondaryColorHsl = ColorUtils.hexToHsl(secondaryColorHex);
  const {
    h: primaryColorH,
    s: primaryColorS,
    l: primaryColorL,
  } = ColorUtils.splitHslComponents(primaryColorHsl);
  const {
    h: secondaryColorH,
    s: secondaryColorS,
    l: secondaryColorL,
  } = ColorUtils.splitHslComponents(secondaryColorHsl);

  // Prepare pricing data
  const pricingRows = PricingUtils.preparePricingRows(ctx.rows);
  const totals = summarize(ctx.rows);
  const hasPricing = ctx.rows.length > 0;

  // Prepare images
  const images = ctx.offer.images || ctx.images || [];
  const hasImages = images.length > 0;

  // Prepare guarantees - ensure it's always an array
  const guaranteesRaw = ctx.offer.guarantees;
  const guarantees = Array.isArray(guaranteesRaw)
    ? guaranteesRaw.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];
  const hasGuarantees = guarantees.length > 0;

  // Prepare schedule (milestones) - ensure it's always an array
  const scheduleRaw = ctx.offer.schedule;
  const schedule = Array.isArray(scheduleRaw)
    ? scheduleRaw.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];
  const hasSchedule = schedule.length > 0;

  // Prepare body HTML - it's already HTML content from AI generation
  // The template will render it within the service-list container
  const bodyHtml = ctx.offer.bodyHtml || '';

  // Determine tier label
  const tierLabel = ctx.offer.templateId?.includes('premium')
    ? 'Prémium csomag'
    : 'Ingyenes csomag';

  // Parse terms text into items if it contains structured content
  const termsText = ctx.offer.pricingFootnote || null;
  const termsItems = TermsUtils.parseTermsText(termsText);

  // Get current year
  const currentYear = new Date().getFullYear();
  const hasTerms = termsItems.length > 0 || Boolean(termsText);
  const showMonogramFallback = !safeCtx.logoUrl;

  // Validate required data
  if (!safeCtx.title || safeCtx.title.trim().length === 0) {
    logger.warn('Rendering template with empty title', {
      templatePath,
      offerId: ctx.offer.templateId,
    });
  }

  // Prepare template data
  const templateData: Record<string, unknown> = {
    locale: ctx.offer.locale || 'hu',
    title: safeCtx.title,
    companyName: safeCtx.company.value,
    issueDate: FormatUtils.formatDate(ctx.offer.issueDate),
    logoUrl: safeCtx.logoUrl,
    logoAlt: safeCtx.logoAlt,
    monogram: safeCtx.monogram,
    tierLabel,
    primaryColorHex,
    secondaryColorHex,
    primaryColorHsl,
    secondaryColorHsl,
    primaryColorH,
    primaryColorS,
    primaryColorL,
    secondaryColorH,
    secondaryColorS,
    secondaryColorL,
    bodyHtml,
    hasPricing,
    pricingRows,
    grossTotal: FormatUtils.formatCurrency(totals.gross),
    hasImages,
    images: images.map((img) => ({
      src: img.src,
      alt: img.alt || '',
    })),
    contactName: safeCtx.contactName.isPlaceholder ? null : safeCtx.contactName.value,
    contactEmail: safeCtx.contactEmail.isPlaceholder ? null : safeCtx.contactEmail.value,
    contactPhone: safeCtx.contactPhone.isPlaceholder ? null : safeCtx.contactPhone.value,
    companyWebsite: safeCtx.companyWebsite.isPlaceholder ? null : safeCtx.companyWebsite.value,
    companyAddress: safeCtx.companyAddress.isPlaceholder ? null : safeCtx.companyAddress.value,
    companyTaxId: safeCtx.companyTaxId.isPlaceholder ? null : safeCtx.companyTaxId.value,
    termsText,
    termsItems: termsItems.length > 0 ? termsItems : null,
    hasTerms,
    currentYear,
    showMonogramFallback,
    offerNumber: null, // Could be derived from offer ID if needed
    guarantees, // Always an array (empty if no guarantees)
    hasGuarantees,
    schedule, // Always an array (empty if no schedule)
    hasSchedule,
  };

  try {
    const rendered = engine.render(templateData);

    // Validate rendered output
    if (!rendered || rendered.trim().length === 0) {
      logger.error('Template rendered to empty string', undefined, {
        templatePath,
        offerId: ctx.offer.templateId,
        title: safeCtx.title,
      });
      throw new Error('Template rendered to empty string');
    }

    // Check for common rendering issues
    if (rendered.includes('{{') || rendered.includes('}}')) {
      const remainingVars = engine.detectRemainingVariables(rendered);
      if (remainingVars.length > 0) {
        logger.warn('Template has unresolved variables', {
          templatePath,
          unresolvedVariables: remainingVars,
          offerId: ctx.offer.templateId,
        });
      }
    }

    return rendered;
  } catch (error) {
    logger.error('Failed to render HTML template', error, {
      templatePath,
      offerId: ctx.offer.templateId,
      title: safeCtx.title,
    });
    throw error;
  }
}
