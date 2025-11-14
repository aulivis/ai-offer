import { sanitizeInput } from '@/lib/sanitize';
import { summarize } from '@/app/lib/pricing';
import type { PriceRow } from '@/app/lib/pricing';
import type { RenderCtx } from '../types';
import { buildHeaderFooterCtx } from '../shared/headerFooter';

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

    // Handle conditionals {{#if var}}...{{/if}}
    result = this.processConditionals(result, data);

    // Handle loops {{#each array}}...{{/each}}
    result = this.processLoops(result, data);

    // Handle unescaped HTML {{{var}}}
    result = this.processUnescapedVariables(result, data);

    // Handle regular variables {{var}}
    result = this.processVariables(result, data);

    return result;
  }

  private processConditionals(template: string, data: Record<string, unknown>): string {
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    return template.replace(ifRegex, (match, varName, content) => {
      const value = this.getNestedValue(data, varName);
      if (this.isTruthy(value)) {
        return content;
      }
      return '';
    });
  }

  private processLoops(template: string, data: Record<string, unknown>): string {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    return template.replace(eachRegex, (match, varName, content) => {
      const array = this.getNestedValue(data, varName);
      if (!Array.isArray(array)) {
        return '';
      }
      return array
        .map((item) => {
          // Create a new data context with the item's properties
          const itemData = { ...data, ...item };
          // Process nested conditionals and variables in the loop content
          let itemContent = this.processConditionals(content, itemData);
          itemContent = this.processUnescapedVariables(itemContent, itemData);
          itemContent = this.processVariables(itemContent, itemData);
          return itemContent;
        })
        .join('');
    });
  }

  private processUnescapedVariables(template: string, data: Record<string, unknown>): string {
    const unescapedRegex = /\{\{\{(\w+)\}\}\}/g;
    return template.replace(unescapedRegex, (match, varName) => {
      const value = this.getNestedValue(data, varName);
      return value != null ? String(value) : '';
    });
  }

  private processVariables(template: string, data: Record<string, unknown>): string {
    const varRegex = /\{\{(\w+)\}\}/g;
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
 * Convert hex color to HSL format for CSS variables
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

function splitHslComponents(hsl: string): { h: string; s: string; l: string } {
  const [h, s, l] = hsl
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return {
    h: h ?? '0',
    s: s ?? '0%',
    l: l ?? '0%',
  };
}

/**
 * Normalize hex color (ensure it has # prefix)
 */
function normalizeHexColor(hex: string): string {
  if (!hex) {
    return '#1a1a1a'; // Default fallback
  }
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/**
 * Format currency for Hungarian locale
 */
function formatCurrency(value: number): string {
  return `${value.toLocaleString('hu-HU')} Ft`;
}

/**
 * Format number for Hungarian locale
 */
function formatNumber(value: number): string {
  return value.toLocaleString('hu-HU');
}

/**
 * Format date for Hungarian locale
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return '';
  }
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

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
    const qty = row.qty ?? 0;
    const unitPrice = row.unitPrice ?? 0;
    const vatPct = row.vat ?? 0;
    const lineNet = qty * unitPrice;
    const lineVat = lineNet * (vatPct / 100);
    const lineGross = lineNet + lineVat;
    const name = row.name || '';

    return {
      name,
      qty: formatNumber(qty),
      // Format as "150.000 Ft"
      unitPrice: formatCurrency(unitPrice),
      vat: formatNumber(vatPct),
      // Total is the gross total (net + VAT) to match the example
      total: formatCurrency(lineGross),
    };
  });
}

/**
 * Load HTML template from file
 * Only works on server-side (uses fs module)
 */
export function loadHtmlTemplate(templatePath: string): string {
  // Only load on server-side (Node.js environment)
  // Check for process instead of window for better Node.js detection
  if (typeof process === 'undefined' || !process.versions?.node) {
    throw new Error('loadHtmlTemplate can only be called on the server');
  }

  try {
    // Dynamic require to avoid bundling fs in client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('fs');
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load HTML template from ${templatePath}: ${error}`);
  }
}

/**
 * Render HTML template with offer data
 */
export function renderHtmlTemplate(ctx: RenderCtx, templatePath: string): string {
  const templateContent = loadHtmlTemplate(templatePath);
  const engine = new HtmlTemplateEngine(templateContent);
  const safeCtx = buildHeaderFooterCtx(ctx);

  // Prepare brand colors
  const primaryColor = ctx.branding?.primaryColor || ctx.tokens.color.primary;
  const secondaryColor = ctx.branding?.secondaryColor || ctx.tokens.color.secondary;
  const primaryColorHex = normalizeHexColor(primaryColor);
  const secondaryColorHex = normalizeHexColor(secondaryColor);
  const primaryColorHsl = hexToHsl(primaryColorHex);
  const secondaryColorHsl = hexToHsl(secondaryColorHex);
  const {
    h: primaryColorH,
    s: primaryColorS,
    l: primaryColorL,
  } = splitHslComponents(primaryColorHsl);
  const {
    h: secondaryColorH,
    s: secondaryColorS,
    l: secondaryColorL,
  } = splitHslComponents(secondaryColorHsl);

  // Prepare pricing data
  const pricingRows = preparePricingRows(ctx.rows);
  const totals = summarize(ctx.rows);
  const hasPricing = ctx.rows.length > 0;

  // Prepare images
  const images = ctx.offer.images || ctx.images || [];
  const hasImages = images.length > 0;

  // Prepare body HTML - it's already HTML content from AI generation
  // The template will render it within the service-list container
  const bodyHtml = ctx.offer.bodyHtml || '';

  // Determine tier label
  const tierLabel = ctx.offer.templateId?.includes('premium')
    ? 'Prémium csomag'
    : 'Ingyenes csomag';

  // Parse terms text into items if it contains structured content
  // For now, we'll use the termsText as-is, but could parse it into items
  const termsText = ctx.offer.pricingFootnote || null;
  const termsItems: Array<{ number: number; title: string; description: string }> = [];

  // If termsText contains numbered items, parse them
  if (termsText) {
    // Simple parsing: look for patterns like "1. Title\nDescription"
    const lines = termsText.split('\n').filter((line) => line.trim().length > 0);
    let currentItem: { number: number; title: string; description: string } | null = null;

    for (const line of lines) {
      const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (numberedMatch) {
        if (currentItem) {
          termsItems.push(currentItem);
        }
        currentItem = {
          number: parseInt(numberedMatch[1]!, 10),
          title: numberedMatch[2]!.trim(),
          description: '',
        };
      } else if (currentItem) {
        currentItem.description += (currentItem.description ? ' ' : '') + line.trim();
      }
    }
    if (currentItem) {
      termsItems.push(currentItem);
    }
  }

  // Get current year
  const currentYear = new Date().getFullYear();
  const hasTerms = termsItems.length > 0 || Boolean(termsText);
  const showMonogramFallback = !safeCtx.logoUrl;

  // Prepare template data
  const templateData: Record<string, unknown> = {
    locale: ctx.offer.locale || 'hu',
    title: safeCtx.title,
    companyName: safeCtx.company.value,
    issueDate: formatDate(ctx.offer.issueDate),
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
    grossTotal: formatCurrency(totals.gross),
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
  };

  return engine.render(templateData);
}
