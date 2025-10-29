import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PdfJobInput } from '@/lib/queue/pdf';

const launchMock = vi.fn();

vi.mock('puppeteer', () => ({
  default: {
    launch: (...args: unknown[]) => launchMock(...args),
  },
}));

function createJob(overrides: Partial<PdfJobInput> = {}): PdfJobInput {
  return {
    jobId: 'job-123',
    offerId: 'offer-123',
    userId: 'user-123',
    storagePath: 'offers/job-123.pdf',
    html: '<p>Hello</p>',
    usagePeriodStart: '2024-07-01',
    userLimit: 5,
    deviceId: null,
    deviceLimit: null,
    callbackUrl: null,
    ...overrides,
  };
}

function ensureServerEnv() {
  if (!process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI) {
    process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI =
      'https://example.supabase.co/auth/v1/callback';
  }
}

function createSupabaseStub() {
  const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateMock = vi.fn(() => ({
    eq: (column: string, value: unknown) => eqMock(column, value),
  }));

  const fromMock = vi.fn((table: string) => {
    if (table === 'pdf_jobs') {
      return {
        update: (values: unknown) => {
          updateMock(values);
          return {
            eq: (column: string, value: unknown) => eqMock(column, value),
          };
        },
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  const storageBucket = {
    upload: vi.fn(),
    getPublicUrl: vi.fn(() => ({ data: null })),
    remove: vi.fn(),
  };

  const storage = {
    from: vi.fn(() => storageBucket),
  };

  const supabase = {
    from: fromMock,
    storage,
  } as unknown as SupabaseClient;

  return { supabase, fromMock, updateMock, eqMock, storageBucket };
}

describe('processPdfJobInline resource cleanup', () => {
  beforeEach(() => {
    launchMock.mockReset();
    ensureServerEnv();
  });

  it('closes the page and browser when rendering fails', async () => {
    const pageClose = vi.fn().mockResolvedValue(undefined);
    const browserClose = vi.fn().mockResolvedValue(undefined);
    const setContent = vi.fn().mockRejectedValue(new Error('render failed'));

    const page = {
      setContent,
      pdf: vi.fn(),
      setDefaultNavigationTimeout: vi.fn(),
      setDefaultTimeout: vi.fn(),
      close: pageClose,
    };

    const browser = {
      newPage: vi.fn().mockResolvedValue(page),
      close: browserClose,
    };

    launchMock.mockResolvedValue(browser);

    const { supabase, eqMock } = createSupabaseStub();
    const { processPdfJobInline } = await import('@/lib/pdfInlineWorker');

    await expect(processPdfJobInline(supabase, createJob())).rejects.toThrow('render failed');

    expect(pageClose).toHaveBeenCalledTimes(1);
    expect(browserClose).toHaveBeenCalledTimes(1);

    expect(eqMock).toHaveBeenCalledWith('id', 'job-123');
  });

  it('still closes the browser when a new page cannot be created', async () => {
    const browserClose = vi.fn().mockResolvedValue(undefined);
    const browser = {
      newPage: vi.fn().mockRejectedValue(new Error('new page failed')),
      close: browserClose,
    };

    launchMock.mockResolvedValue(browser);

    const { supabase } = createSupabaseStub();
    const { processPdfJobInline } = await import('@/lib/pdfInlineWorker');

    await expect(processPdfJobInline(supabase, createJob())).rejects.toThrow('new page failed');

    expect(browserClose).toHaveBeenCalledTimes(1);
  });

  it('renders PDFs with backgrounds, margins, and timeouts configured', async () => {
    const pdfBuffer = new Uint8Array([1, 2, 3]);
    const pageClose = vi.fn().mockResolvedValue(undefined);
    const browserClose = vi.fn().mockResolvedValue(undefined);
    const setContent = vi.fn().mockResolvedValue(undefined);
    const pdf = vi.fn().mockResolvedValue(pdfBuffer);

    const page = {
      setContent,
      pdf,
      setDefaultNavigationTimeout: vi.fn(),
      setDefaultTimeout: vi.fn(),
      close: pageClose,
    };

    const browser = {
      newPage: vi.fn().mockResolvedValue(page),
      close: browserClose,
    };

    launchMock.mockResolvedValue(browser);

    const { supabase, storageBucket } = createSupabaseStub();
    storageBucket.upload.mockResolvedValue({ error: { message: 'upload failed' } });

    const { processPdfJobInline } = await import('@/lib/pdfInlineWorker');

    await expect(processPdfJobInline(supabase, createJob())).rejects.toThrow('upload failed');

    expect(page.setDefaultNavigationTimeout).toHaveBeenCalledWith(90_000);
    expect(page.setDefaultTimeout).toHaveBeenCalledWith(90_000);
    expect(setContent).toHaveBeenCalledWith('<p>Hello</p>', { waitUntil: 'networkidle0' });
    expect(pdf).toHaveBeenCalledWith({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '24mm',
        right: '16mm',
        bottom: '24mm',
        left: '16mm',
      },
    });

    expect(pageClose).toHaveBeenCalledTimes(1);
    expect(browserClose).toHaveBeenCalledTimes(1);
  });
});
