import { BASE_STYLES } from '../app/pdf/sdk/baseStyles';
import { tokensToCssVars } from '../app/pdf/sdk/cssVars';
import type { BrandInput, DocSlots, RenderContext } from '../app/pdf/sdk/types';
import { buildTokens } from '../app/pdf/sdk/tokens';
import { getTemplateMeta } from '../app/pdf/templates/registry';
import { createTranslator } from '../copy';
import { PDF_ENGINE_META_TAG } from './pdfHtmlSignature';

export type RuntimePdfPayload = {
  templateId: string;
  locale?: string | null;
  brand: BrandInput;
  slots: DocSlots;
};

export function renderRuntimePdfHtml(payload: RuntimePdfPayload): string {
  const templateMeta = getTemplateMeta(payload.templateId);

  if (!templateMeta) {
    throw new Error(`Unknown PDF template: ${payload.templateId}`);
  }

  const template = templateMeta.factory();
  const tokens = buildTokens(payload.brand);
  const cssVars = tokensToCssVars(tokens);
  const translator = createTranslator(payload.locale);

  const ctx: RenderContext = {
    slots: payload.slots,
    tokens,
    i18n: translator,
  };

  const headHtml = template.renderHead(ctx);
  const bodyHtml = template.renderBody(ctx);
  const styles = `${BASE_STYLES}${cssVars}`;

  return `<!DOCTYPE html><html lang="${translator.locale}"><head>${PDF_ENGINE_META_TAG}<style>${styles}</style></head><body>${headHtml}${bodyHtml}</body></html>`;
}
