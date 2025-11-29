import type { OfferTemplate, RenderCtx, TemplateId } from './types';
import { loadTemplate } from './engineRegistry';
import { createThemeCssVariables, createThemeTokens } from './theme';
import { PDF_ENGINE_META_TAG } from '@/lib/pdfHtmlSignature';
import { attachTemplateVariables } from './variableContext';
import { logger } from '@/lib/logger';

const HTML_ROOT_PATTERN = /^<html[\s\S]*<\/html>$/i;
const UNSAFE_HTML_PATTERN = /<script\b|onerror\s*=|onload\s*=|javascript:/i;

function normalizeLang(value: string | null | undefined): string {
  const fallback = 'hu';
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const normalized = trimmed.toLowerCase();
  return /^[a-z]{2}(?:-[a-z0-9]+)?$/i.test(normalized) ? normalized : fallback;
}

function minifyCssDeclarations(css: string): string {
  return css
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...valueParts] = rule.split(':');
      if (!property || valueParts.length === 0) {
        return rule;
      }
      const name = property.trim();
      const value = valueParts.join(':').trim().replace(/\s+/g, ' ');
      return `${name}:${value}`;
    })
    .join(';');
}

function minifyInlineStyle(css: string): string {
  return minifyCssDeclarations(css);
}

function minifyInlineCss(html: string): string {
  return html.replace(/style="([^"]*)"/gi, (_, css: string) => {
    const minified = minifyInlineStyle(css);
    return minified ? `style="${minified}"` : 'style=""';
  });
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/;}/g, '}')
    .trim();
}

function minifyStyleTags(html: string): string {
  return html.replace(/<style(\b[^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs: string, css: string) => {
    const minified = minifyCss(css);
    return `<style${attrs}>${minified}</style>`;
  });
}

function minifyWhitespace(html: string): string {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function minifyHtml(html: string): string {
  const withoutNewlines = html.replace(/\n+/g, ' ');
  const minifiedWhitespace = minifyWhitespace(withoutNewlines);
  const withMinifiedInline = minifyInlineCss(minifiedWhitespace);
  return minifyStyleTags(withMinifiedInline);
}

function stripDoctype(html: string): string {
  return html.replace(/^<!DOCTYPE [^>]+>/i, '').trim();
}

function validateFinalHtml(html: string): void {
  const withoutDoctype = stripDoctype(html);

  if (!HTML_ROOT_PATTERN.test(withoutDoctype)) {
    throw new Error('Rendered HTML is missing the <html> root element.');
  }

  const unsafeMatch = UNSAFE_HTML_PATTERN.exec(withoutDoctype);
  if (unsafeMatch) {
    throw new Error(`Unsafe HTML blocked in rendered document (${unsafeMatch[0]}).`);
  }
}

function renderWithTemplate(ctx: RenderCtx, tpl: OfferTemplate): string {
  const lang = normalizeLang(ctx.offer.locale);
  const headContent = tpl.renderHead(ctx).trim();
  const body = tpl.renderBody(ctx).trim();
  const themeStyles = createThemeCssVariables(ctx.tokens);
  const inlineStyles = [tpl.styles.print, tpl.styles.template, themeStyles]
    .map((css) => css.trim())
    .filter(Boolean)
    .join('\n');
  const styleTag = inlineStyles ? `<style>${inlineStyles}</style>` : '';
  const headWithSignature = `${headContent}${PDF_ENGINE_META_TAG}${styleTag}`;

  const minifiedHead = minifyHtml(headWithSignature);
  const minifiedBody = minifyHtml(body);

  const html = `<!DOCTYPE html><html lang="${lang}"><head>${minifiedHead}</head><body>${minifiedBody}</body></html>`;

  validateFinalHtml(html);

  return html;
}

type BuildOfferHtmlOptions = {
  offer: RenderCtx['offer'];
  rows: RenderCtx['rows'];
  branding?: RenderCtx['branding'];
  i18n: RenderCtx['i18n'];
  templateId: TemplateId;
  images?: RenderCtx['images'];
};

/**
 * Build complete offer HTML using the unified template system.
 *
 * This is the primary function for rendering offers. All offer HTML should be
 * generated through this function to ensure consistency and proper template handling.
 *
 * @param options - Rendering options including offer data, pricing, branding, and template ID
 * @returns Complete HTML document as string
 * @throws Error if template cannot be loaded or rendered
 *
 * @example
 * ```typescript
 * const html = buildOfferHtml({
 *   offer: {
 *     title: 'My Offer',
 *     companyName: 'My Company',
 *     bodyHtml: '<p>Offer content</p>',
 *     templateId: 'free.minimal.html@1.0.0',
 *     locale: 'hu',
 *   },
 *   rows: pricingRows,
 *   branding: { primaryColor: '#1c274c', secondaryColor: '#e2e8f0' },
 *   i18n: translator,
 *   templateId: 'free.minimal.html@1.0.0',
 * });
 * ```
 */
export function buildOfferHtml(options: BuildOfferHtmlOptions): string {
  let template: OfferTemplate;
  try {
    template = loadTemplate(options.templateId);
  } catch (error) {
    // Log error for debugging
    logger.error(`Failed to load template ${options.templateId}`, {
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
      templateId: options.templateId,
      offerId: options.offer.templateId,
    });
    // Re-throw to let caller handle it (they should have fallback logic)
    throw error;
  }

  const tokens = createThemeTokens(template.tokens, options.branding);
  const normalizedImages = Array.isArray(options.images)
    ? options.images
    : Array.isArray(options.offer.images)
      ? options.offer.images
      : undefined;
  const offer = {
    ...options.offer,
    templateId: template.id,
    ...(normalizedImages ? { images: normalizedImages } : {}),
  };

  const ctx: RenderCtx = {
    offer,
    rows: options.rows,
    ...(options.branding && { branding: options.branding }),
    i18n: options.i18n,
    tokens,
    ...(normalizedImages ? { images: normalizedImages } : {}),
  };

  const ctxWithVariables = attachTemplateVariables(ctx);

  return renderWithTemplate(ctxWithVariables, template);
}
