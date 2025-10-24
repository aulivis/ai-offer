import { envServer } from '@/env.server';

import {
  createPdfWebhookAllowlist,
  isPdfWebhookUrlAllowed as baseIsPdfWebhookUrlAllowed,
  PdfWebhookValidationError,
  type PdfWebhookAllowlistEntry,
  validatePdfWebhookUrl as baseValidatePdfWebhookUrl,
} from '../../shared/pdfWebhook';

const allowlist: PdfWebhookAllowlistEntry[] = createPdfWebhookAllowlist(envServer.PDF_WEBHOOK_ALLOWLIST);

export { PdfWebhookValidationError } from '../../shared/pdfWebhook';

export function validatePdfWebhookUrl(input: unknown): string | null {
  if (input === undefined || input === null) {
    return null;
  }

  if (typeof input !== 'string') {
    throw new PdfWebhookValidationError('A megadott webhook URL érvénytelen.', 'invalid_url');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  return baseValidatePdfWebhookUrl(trimmed, allowlist);
}

export function isPdfWebhookUrlAllowed(target: string | URL | null | undefined): boolean {
  if (!target) {
    return false;
  }

  return baseIsPdfWebhookUrlAllowed(target, allowlist);
}

export function getPdfWebhookAllowlist(): readonly PdfWebhookAllowlistEntry[] {
  return allowlist;
}
