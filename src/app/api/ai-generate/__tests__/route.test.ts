/* @vitest-environment node */

import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertOfferMock,
  enqueuePdfJobMock,
  dispatchPdfJobMock,
  countPendingPdfJobsMock,
  getUsageSnapshotMock,
  getDeviceUsageSnapshotMock,
  getCurrentUserMock,
  getUserProfileMock,
  resolveEffectivePlanMock,
  uuidMock,
  cookiesGetMock,
  cookiesSetMock,
  processPdfJobInlineMock,
} = vi.hoisted(() => ({
  insertOfferMock: vi.fn(),
  enqueuePdfJobMock: vi.fn(),
  dispatchPdfJobMock: vi.fn(),
  countPendingPdfJobsMock: vi.fn(),
  getUsageSnapshotMock: vi.fn(),
  getDeviceUsageSnapshotMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  resolveEffectivePlanMock: vi.fn(),
  uuidMock: vi.fn(),
  cookiesGetMock: vi.fn(),
  cookiesSetMock: vi.fn(),
  processPdfJobInlineMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    from(table: string) {
      if (table === 'offers') {
        return {
          insert: insertOfferMock,
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    OPENAI_API_KEY: 'test-openai-key',
    STRIPE_SECRET_KEY: 'sk_test',
    APP_URL: 'https://app.example.com',
    STRIPE_PRICE_ALLOWLIST: [],
  },
}));

vi.mock('@/lib/services/user', () => ({
  getCurrentUser: getCurrentUserMock,
  getUserProfile: getUserProfileMock,
}));

vi.mock('@/lib/services/usage', () => ({
  currentMonthStart: () => ({ iso: '2025-05-01', date: new Date('2025-05-01T00:00:00Z') }),
  getUsageSnapshot: getUsageSnapshotMock,
  getDeviceUsageSnapshot: getDeviceUsageSnapshotMock,
}));

vi.mock('@/lib/subscription', () => ({
  resolveEffectivePlan: resolveEffectivePlanMock,
}));

vi.mock('@/app/lib/pricing', () => ({
  priceTableHtml: () => '<table />',
}));

vi.mock('@/app/lib/htmlTemplate', () => ({
  offerHtml: () => '<html />',
}));

vi.mock('@/lib/queue/pdf', () => ({
  enqueuePdfJob: enqueuePdfJobMock,
  dispatchPdfJob: dispatchPdfJobMock,
  countPendingPdfJobs: countPendingPdfJobsMock,
}));

vi.mock('@/lib/pdfInlineWorker', () => ({
  processPdfJobInline: processPdfJobInlineMock,
}));

vi.mock('@/lib/sanitize', () => ({
  sanitizeInput: (value: unknown) => (typeof value === 'string' ? value : ''),
  sanitizeHTML: (value: unknown) => (typeof value === 'string' ? value : ''),
}));

vi.mock('uuid', () => ({
  v4: uuidMock,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: cookiesGetMock,
    set: cookiesSetMock,
  })),
}));

function createRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): NextRequest {
  const headerMap = new Headers({ 'content-type': 'application/json', ...headers });
  return {
    headers: headerMap,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('POST /api/ai-generate', () => {
  beforeEach(() => {
    insertOfferMock.mockReset();
    enqueuePdfJobMock.mockReset();
    dispatchPdfJobMock.mockReset();
    countPendingPdfJobsMock.mockReset();
    getUsageSnapshotMock.mockReset();
    getDeviceUsageSnapshotMock.mockReset();
    getCurrentUserMock.mockReset();
    getUserProfileMock.mockReset();
    resolveEffectivePlanMock.mockReset();
    uuidMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesSetMock.mockReset();
    processPdfJobInlineMock.mockReset();

    insertOfferMock.mockResolvedValue({ error: null });
    enqueuePdfJobMock.mockRejectedValue(new Error('queue failed'));
    dispatchPdfJobMock.mockResolvedValue(undefined);
    countPendingPdfJobsMock.mockResolvedValue(0);
    getUsageSnapshotMock.mockResolvedValue({ periodStart: '2025-05-01', offersGenerated: 0 });
    getDeviceUsageSnapshotMock.mockResolvedValue({ periodStart: '2025-05-01', offersGenerated: 0 });
    getCurrentUserMock.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });
    getUserProfileMock.mockResolvedValue({ plan: 'free' });
    resolveEffectivePlanMock.mockReturnValue('free');
    uuidMock
      .mockReturnValueOnce('offer-uuid')
      .mockReturnValueOnce('job-token');
    cookiesGetMock.mockReturnValue(undefined);
    processPdfJobInlineMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the saved offer when PDF queueing fails', async () => {
    const { POST } = await import('../route');

    const request = createRequest(
      {
        title: 'Ajánlat címe',
        industry: 'Marketing',
        description: 'Részletes leírás',
        deadline: '',
        language: 'hu',
        brandVoice: 'friendly',
        style: 'detailed',
        prices: [
          { name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 },
        ],
        aiOverrideHtml: '<p>Előnézet</p>',
        clientId: null,
        pdfWebhookUrl: null,
        imageAssets: [],
      },
      { authorization: 'Bearer test-token' },
    );

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Nem sikerült elindítani a PDF generálását.'),
      offerId: 'offer-uuid',
    });

    expect(insertOfferMock).toHaveBeenCalledTimes(1);
    expect(insertOfferMock).toHaveBeenCalledWith({
      id: 'offer-uuid',
      user_id: 'user-123',
      title: 'Ajánlat címe',
      industry: 'Marketing',
      recipient_id: null,
      inputs: {
        description: 'Részletes leírás',
        deadline: '',
        language: 'hu',
        brandVoice: 'friendly',
        style: 'detailed',
      },
      ai_text: '<p>Előnézet</p>',
      price_json: [
        { name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 },
      ],
      pdf_url: null,
      status: 'draft',
    });

    expect(dispatchPdfJobMock).not.toHaveBeenCalled();
  });

  it('falls back to inline PDF generation when dispatch fails', async () => {
    enqueuePdfJobMock.mockResolvedValueOnce(undefined);
    dispatchPdfJobMock.mockRejectedValueOnce(new Error('Edge Function returned a non-2xx status code'));
    processPdfJobInlineMock.mockResolvedValueOnce('https://cdn.example.com/offers/offer-uuid.pdf');

    const { POST } = await import('../route');

    const request = createRequest(
      {
        title: 'Ajánlat címe',
        industry: 'Marketing',
        description: 'Részletes leírás',
        deadline: '',
        language: 'hu',
        brandVoice: 'friendly',
        style: 'detailed',
        prices: [
          { name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 },
        ],
        aiOverrideHtml: '<p>Előnézet</p>',
        clientId: null,
        pdfWebhookUrl: null,
        imageAssets: [],
      },
      { authorization: 'Bearer test-token' },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: 'completed',
      pdfUrl: 'https://cdn.example.com/offers/offer-uuid.pdf',
      note: 'A PDF generálása helyben készült el, azonnal letölthető.',
    });

    expect(enqueuePdfJobMock).toHaveBeenCalledTimes(1);
    expect(dispatchPdfJobMock).toHaveBeenCalledTimes(1);
    expect(processPdfJobInlineMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        jobId: 'job-token',
        offerId: 'offer-uuid',
        storagePath: expect.stringContaining('offer-uuid.pdf'),
      }),
    );
  });

  it('fails when the PDF worker dispatch cannot be invoked', async () => {
    const { POST } = await import('../route');

    enqueuePdfJobMock.mockResolvedValue(undefined);
    dispatchPdfJobMock.mockRejectedValue(new Error('invoke failed'));
    processPdfJobInlineMock.mockRejectedValue(new Error('inline failed'));

    const request = createRequest(
      {
        title: 'Ajánlat címe',
        industry: 'Marketing',
        description: 'Részletes leírás',
        deadline: '',
        language: 'hu',
        brandVoice: 'friendly',
        style: 'detailed',
        prices: [
          { name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 },
        ],
        aiOverrideHtml: '<p>Előnézet</p>',
        clientId: null,
        pdfWebhookUrl: null,
        imageAssets: [],
      },
      { authorization: 'Bearer test-token' },
    );

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Nem sikerült elindítani a PDF generálását.'),
      offerId: 'offer-uuid',
    });

    expect(enqueuePdfJobMock).toHaveBeenCalledTimes(1);
    expect(dispatchPdfJobMock).toHaveBeenCalledWith(expect.anything(), 'job-token');
    expect(processPdfJobInlineMock).toHaveBeenCalledTimes(1);
  });
});
