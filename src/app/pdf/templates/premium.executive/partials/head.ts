import { sanitizeInput } from '@/lib/sanitize';
import { generateFontPreloads } from '../../shared/fonts';

import type { RenderCtx } from '../../types';

export function renderHead(ctx: RenderCtx): string {
  const safeTitle = sanitizeInput(
    ctx.offer.title || ctx.i18n.t('pdf.templates.common.defaultTitle'),
  );

  return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    ${generateFontPreloads()}
  `;
}













