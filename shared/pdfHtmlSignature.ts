export const PDF_ENGINE_META_NAME = 'x-ai-offer-pdf-engine';
export const PDF_ENGINE_META_CONTENT = 'offer-template@1';
export const PDF_ENGINE_META_TAG = `<meta name="${PDF_ENGINE_META_NAME}" content="${PDF_ENGINE_META_CONTENT}" data-engine="ai-offer" />`;

const SIGNATURE_REGEX = new RegExp(
  `<meta\\s+[^>]*name=["']${PDF_ENGINE_META_NAME}["'][^>]*content=["']${PDF_ENGINE_META_CONTENT}["'][^>]*>`,
  'i',
);

export function hasPdfEngineSignature(html: unknown): html is string {
  if (typeof html !== 'string') {
    return false;
  }
  return SIGNATURE_REGEX.test(html);
}

export function assertPdfEngineHtml(html: unknown, context = 'PDF HTML'): asserts html is string {
  if (typeof html !== 'string') {
    throw new Error(`${context} must be a string.`);
  }

  if (!SIGNATURE_REGEX.test(html)) {
    throw new Error(`${context} is missing the PDF engine signature meta tag.`);
  }
}

export function createMinimalEngineHtml(body = ''): string {
  const safeBody = typeof body === 'string' ? body : '';
  return `<!DOCTYPE html><html lang="hu"><head>${PDF_ENGINE_META_TAG}</head><body>${safeBody}</body></html>`;
}
