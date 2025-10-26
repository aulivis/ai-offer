/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCsrfToken } from '../../../../../lib/auth/csrf';
import { CONSENT_COOKIE_NAME } from '../../../../../lib/consent/constants';
import type { AuthenticatedNextRequest } from '../../../../../middleware/auth';

const {
  insertOfferMock,
  enqueuePdfJobMock,
  dispatchPdfJobMock,
  countPendingPdfJobsMock,
  getUsageSnapshotMock,
  getDeviceUsageSnapshotMock,
  anonGetUserMock,
  getUserProfileMock,
  resolveEffectivePlanMock,
  uuidMock,
  cookiesGetMock,
  cookiesSetMock,
  processPdfJobInlineMock,
  supabaseServerMock,
} = vi.hoisted(() => ({
  insertOfferMock: vi.fn(),
  enqueuePdfJobMock: vi.fn(),
  dispatchPdfJobMock: vi.fn(),
  countPendingPdfJobsMock: vi.fn(),
  getUsageSnapshotMock: vi.fn(),
  getDeviceUsageSnapshotMock: vi.fn(),
  anonGetUserMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  resolveEffectivePlanMock: vi.fn(),
  uuidMock: vi.fn(),
  cookiesGetMock: vi.fn(),
  cookiesSetMock: vi.fn(),
  processPdfJobInlineMock: vi.fn(),
  supabaseServerMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: supabaseServerMock,
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    OPENAI_API_KEY: 'test-openai-key',
    STRIPE_SECRET_KEY: 'sk_test',
    APP_URL: 'https://app.example.com',
    STRIPE_PRICE_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: ['https://hooks.example.com'],
    PUBLIC_CONTACT_EMAIL: 'hello@example.com',
  },
}));

vi.mock('@/lib/services/user', () => ({
  getUserProfile: getUserProfileMock,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: anonGetUserMock,
    },
  }),
}));

vi.mock('@/env.client', () => ({
  envClient: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  },
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

function createRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): AuthenticatedNextRequest {
  const { token: csrfToken, value: csrfCookie } = createCsrfToken();
  const headerMap = new Headers({
    'content-type': 'application/json',
    'x-csrf-token': csrfToken,
    ...headers,
  });
  const cookieJar = {
    propono_at: 'test-token',
    'XSRF-TOKEN': csrfCookie,
  } satisfies Record<string, string>;

  return {
    method: 'POST',
    headers: headerMap,
    json: vi.fn().mockResolvedValue(body),
    cookies: {
      get: (name: string) =>
        cookieJar[name as keyof typeof cookieJar]
          ? { name, value: cookieJar[name as keyof typeof cookieJar] }
          : undefined,
      getAll: () => Object.entries(cookieJar).map(([name, value]) => ({ name, value })),
      has: (name: string) => Boolean(cookieJar[name as keyof typeof cookieJar]),
    },
  } as unknown as AuthenticatedNextRequest;
}

describe('POST /api/ai-generate', () => {
  beforeEach(() => {
    insertOfferMock.mockReset();
    enqueuePdfJobMock.mockReset();
    dispatchPdfJobMock.mockReset();
    countPendingPdfJobsMock.mockReset();
    getUsageSnapshotMock.mockReset();
    getDeviceUsageSnapshotMock.mockReset();
    anonGetUserMock.mockReset();
    getUserProfileMock.mockReset();
    resolveEffectivePlanMock.mockReset();
    uuidMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesSetMock.mockReset();
    processPdfJobInlineMock.mockReset();
    supabaseServerMock.mockReset();

    insertOfferMock.mockResolvedValue({ error: null });
    enqueuePdfJobMock.mockRejectedValue(new Error('queue failed'));
    dispatchPdfJobMock.mockResolvedValue(undefined);
    countPendingPdfJobsMock.mockResolvedValue(0);
    getUsageSnapshotMock.mockResolvedValue({ periodStart: '2025-05-01', offersGenerated: 0 });
    getDeviceUsageSnapshotMock.mockResolvedValue({ periodStart: '2025-05-01', offersGenerated: 0 });
    anonGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
      error: null,
    });
    getUserProfileMock.mockResolvedValue({ plan: 'free' });
    resolveEffectivePlanMock.mockReturnValue('free');
    uuidMock.mockReturnValueOnce('offer-uuid').mockReturnValueOnce('job-token');
    cookiesGetMock.mockReturnValue(undefined);
    processPdfJobInlineMock.mockResolvedValue(null);
    supabaseServerMock.mockResolvedValue({
      from(table: string) {
        if (table === 'offers') {
          return { insert: insertOfferMock };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockResolvedValue({ error: null }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a validation error for malformed payloads', async () => {
    const { POST } = await import('../route');

    const response = await POST(createRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Érvénytelen kérés.',
      issues: expect.objectContaining({
        fieldErrors: expect.objectContaining({ title: expect.any(Array) }),
      }),
    });

    expect(insertOfferMock).not.toHaveBeenCalled();
    expect(enqueuePdfJobMock).not.toHaveBeenCalled();
  });

  it('keeps the saved offer when PDF queueing fails', async () => {
    const { POST } = await import('../route');

    const request = createRequest({
      title: 'Ajánlat címe',
      industry: 'Marketing',
      description: 'Részletes leírás',
      deadline: '',
      language: 'hu',
      brandVoice: 'friendly',
      style: 'detailed',
      prices: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
      aiOverrideHtml: '<p>Előnézet</p>',
      clientId: null,
      pdfWebhookUrl: null,
      imageAssets: [],
    });

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
      price_json: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
      pdf_url: null,
      status: 'draft',
    });

    expect(dispatchPdfJobMock).not.toHaveBeenCalled();
  });

  it('falls back to inline PDF generation when dispatch fails', async () => {
    enqueuePdfJobMock.mockResolvedValueOnce(undefined);
    dispatchPdfJobMock.mockRejectedValueOnce(
      new Error('Edge Function returned a non-2xx status code'),
    );
    processPdfJobInlineMock.mockResolvedValueOnce('https://cdn.example.com/offers/offer-uuid.pdf');

    const { POST } = await import('../route');

    const request = createRequest({
      title: 'Ajánlat címe',
      industry: 'Marketing',
      description: 'Részletes leírás',
      deadline: '',
      language: 'hu',
      brandVoice: 'friendly',
      style: 'detailed',
      prices: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
      aiOverrideHtml: '<p>Előnézet</p>',
      clientId: null,
      pdfWebhookUrl: null,
      imageAssets: [],
    });

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

    const request = createRequest({
      title: 'Ajánlat címe',
      industry: 'Marketing',
      description: 'Részletes leírás',
      deadline: '',
      language: 'hu',
      brandVoice: 'friendly',
      style: 'detailed',
      prices: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
      aiOverrideHtml: '<p>Előnézet</p>',
      clientId: null,
      pdfWebhookUrl: null,
      imageAssets: [],
    });

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

  it('does not set the device cookie when analytics consent is denied', async () => {
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
        prices: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
        aiOverrideHtml: '<p>Előnézet</p>',
        clientId: null,
        pdfWebhookUrl: null,
        imageAssets: [],
      },
      {
        cookie: `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
          JSON.stringify({
            granted: { necessary: true, analytics: false, marketing: false },
            timestamp: '2025-01-01T00:00:00.000Z',
            version: 'test',
          }),
        )}`,
      },
    );

    await POST(request);

    expect(cookiesSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'propono_device_id' }),
    );
  });

  it('sets the device cookie when analytics consent is granted', async () => {
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
        prices: [{ name: 'Tétel', qty: 1, unit: 'db', unitPrice: 1000, vat: 27 }],
        aiOverrideHtml: '<p>Előnézet</p>',
        clientId: null,
        pdfWebhookUrl: null,
        imageAssets: [],
      },
      {
        cookie: `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
          JSON.stringify({
            granted: { necessary: true, analytics: true, marketing: false },
            timestamp: '2025-01-01T00:00:00.000Z',
            version: 'test',
          }),
        )}`,
      },
    );

    await POST(request);

    expect(cookiesSetMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'propono_device_id', value: expect.any(String) }),
    );
  });
});
