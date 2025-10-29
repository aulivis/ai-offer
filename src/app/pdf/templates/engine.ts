import type {
  OfferTemplate,
  RenderCtx,
  TemplateId,
} from './types';
import { loadTemplate } from './registry';
import { createThemeTokens } from './theme';

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

function minifyInlineStyle(css: string): string {
  const rules = css
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...valueParts] = rule.split(':');
      if (!property || valueParts.length === 0) {
        return rule;
      }
      return `${property.trim()}:${valueParts.join(':').trim()}`;
    });

  return rules.join(';');
}

function minifyInlineCss(html: string): string {
  return html.replace(/style="([^"]*)"/gi, (_, css: string) => {
    const minified = minifyInlineStyle(css);
    return minified ? `style="${minified}"` : 'style=""';
  });
}

function minifyStyleTags(html: string): string {
  return html.replace(/<style(\b[^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs: string, css: string) => {
    const minified = css
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('');
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
  const head = tpl.renderHead(ctx).trim();
  const body = tpl.renderBody(ctx).trim();

  const minifiedHead = minifyHtml(head);
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

export function buildOfferHtml(options: BuildOfferHtmlOptions): string {
  const template = loadTemplate(options.templateId);

  const tokens = createThemeTokens(template.tokens, options.branding);
  const offer = { ...options.offer, templateId: template.id };

  const ctx: RenderCtx = {
    offer,
    rows: options.rows,
    branding: options.branding,
    i18n: options.i18n,
    tokens,
    ...(options.images ? { images: options.images } : {}),
  };

  return renderWithTemplate(ctx, template);
}
