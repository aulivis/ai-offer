/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importModule() {
  return import('@/lib/pdfWebhook');
}

describe('PDF webhook URL validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('accepts allow-listed HTTPS webhook URLs', async () => {
    vi.doMock('@/env.server', () => ({
      envServer: {
        PDF_WEBHOOK_ALLOWLIST: ['https://hooks.example.com'],
      },
    }));

    const { validatePdfWebhookUrl, isPdfWebhookUrlAllowed } = await importModule();

    const url = validatePdfWebhookUrl('https://hooks.example.com/path#fragment');
    expect(url).toBe('https://hooks.example.com/path');
    expect(isPdfWebhookUrlAllowed(url)).toBe(true);
  });

  it('rejects webhook URLs outside the allow-list', async () => {
    vi.doMock('@/env.server', () => ({
      envServer: {
        PDF_WEBHOOK_ALLOWLIST: ['https://hooks.example.com'],
      },
    }));

    const { validatePdfWebhookUrl, PdfWebhookValidationError } = await importModule();

    let caught: unknown;
    try {
      validatePdfWebhookUrl('https://evil.example.com/webhook');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PdfWebhookValidationError);
    expect((caught as InstanceType<typeof PdfWebhookValidationError>).reason).toBe(
      'host_not_allowlisted',
    );
  });

  it('rejects webhook URLs containing credentials', async () => {
    vi.doMock('@/env.server', () => ({
      envServer: {
        PDF_WEBHOOK_ALLOWLIST: ['https://hooks.example.com'],
      },
    }));

    const { validatePdfWebhookUrl, PdfWebhookValidationError } = await importModule();

    let caught: unknown;
    try {
      validatePdfWebhookUrl('https://user:pass@hooks.example.com/path');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PdfWebhookValidationError);
    expect((caught as InstanceType<typeof PdfWebhookValidationError>).reason).toBe(
      'credentials_not_allowed',
    );
  });

  it('treats missing webhook URLs as optional', async () => {
    vi.doMock('@/env.server', () => ({
      envServer: {
        PDF_WEBHOOK_ALLOWLIST: [],
      },
    }));

    const { validatePdfWebhookUrl, PdfWebhookValidationError } = await importModule();

    expect(validatePdfWebhookUrl(undefined)).toBeNull();
    expect(validatePdfWebhookUrl(null)).toBeNull();
    expect(validatePdfWebhookUrl('   ')).toBeNull();

    let caught: unknown;
    try {
      validatePdfWebhookUrl('https://hooks.example.com/path');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PdfWebhookValidationError);
    expect((caught as InstanceType<typeof PdfWebhookValidationError>).reason).toBe(
      'allowlist_empty',
    );
  });
});
