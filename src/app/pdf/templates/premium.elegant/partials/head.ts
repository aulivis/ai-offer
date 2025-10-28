import { sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { pdfStyles, templateStyles } from '../styles.css';

export function renderHead(ctx: RenderCtx): string {
  const safeTitle = sanitizeInput(ctx.offer.title || 'Árajánlat');

  return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
      ${pdfStyles}
      ${templateStyles}
    </style>
  `;
}
