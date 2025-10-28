import type { OfferTemplate, RenderCtx } from './types';

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

export function buildOfferHtml(ctx: RenderCtx, tpl: OfferTemplate): string {
  const lang = normalizeLang(ctx.offer.locale);
  const head = tpl.renderHead(ctx).trim();
  const body = tpl.renderBody(ctx).trim();

  return [
    '<!DOCTYPE html>',
    `<html lang="${lang}">`,
    '<head>',
    head,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>',
  ].join('\n');
}
