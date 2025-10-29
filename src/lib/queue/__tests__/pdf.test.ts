import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

type RpcResponse = { error: { message: string } | null };

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
  CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
  MAGIC_LINK_RATE_LIMIT_SALT: 'test-rate-limit-salt',
  OPENAI_API_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'sk_test',
  APP_URL: 'https://app.example.com',
  PUBLIC_CONTACT_EMAIL: 'hello@example.com',
  STRIPE_PRICE_ALLOWLIST: '',
  OAUTH_REDIRECT_ALLOWLIST: '',
  PDF_WEBHOOK_ALLOWLIST: '',
  SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI: 'https://example.supabase.co/auth/v1/callback',
};

function stubEnvironment() {
  Object.entries(REQUIRED_ENV).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

function restoreEnvironment() {
  Object.keys(REQUIRED_ENV).forEach((key) => {
    delete process.env[key];
  });
}

function createInsertMock(errors: Array<{ message: string } | null>) {
  const insertMock = vi.fn();
  errors.forEach((error) => {
    insertMock.mockResolvedValueOnce({ error });
  });
  return insertMock;
}

function createProfileSelectMock(plan: string | null = 'free') {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: plan ? { plan } : null, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, maybeSingle };
}

describe('enqueuePdfJob schema cache recovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    stubEnvironment();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreEnvironment();
  });

  it('falls back to PostgREST schema reload when helper function is missing', async () => {
    const insertMock = createInsertMock([
      { message: "Could not find the table 'public.pdf_jobs' in the schema cache" },
      null,
    ]);

    const rpcMock = vi
      .fn<() => Promise<RpcResponse>>()
      .mockResolvedValueOnce({
        error: { message: 'function refresh_pdf_jobs_schema_cache does not exist' },
      })
      .mockResolvedValueOnce({ error: null });

    const profileMocks = createProfileSelectMock('free');

    const fromMock = vi.fn((table: string) => {
      if (table === 'pdf_jobs') {
        return { insert: insertMock };
      }
      if (table === 'profiles') {
        return { select: profileMocks.select };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    const supabase = { from: fromMock, rpc: rpcMock } as unknown as SupabaseClient;

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { enqueuePdfJob } = await import('../pdf');

    await enqueuePdfJob(supabase, {
      jobId: 'job',
      offerId: 'offer',
      userId: 'user',
      storagePath: 'path',
      html: '<p>html</p>',
      usagePeriodStart: '2024-01-01',
      userLimit: null,
    });

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'refresh_pdf_jobs_schema_cache');
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'pgrest_schema_cache_reload');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('performs HTTP schema cache reload when PostgREST RPC is unavailable', async () => {
    const insertMock = createInsertMock([
      { message: "Could not find the table 'public.pdf_jobs' in the schema cache" },
      null,
    ]);

    const rpcMock = vi
      .fn<() => Promise<RpcResponse>>()
      .mockResolvedValueOnce({
        error: { message: 'function refresh_pdf_jobs_schema_cache does not exist' },
      })
      .mockResolvedValueOnce({
        error: { message: 'function pgrest.schema_cache_reload does not exist' },
      });

    const profileMocks = createProfileSelectMock('free');

    const fromMock = vi.fn((table: string) => {
      if (table === 'pdf_jobs') {
        return { insert: insertMock };
      }
      if (table === 'profiles') {
        return { select: profileMocks.select };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    const supabase = { from: fromMock, rpc: rpcMock } as unknown as SupabaseClient;

    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 406 }));
    vi.stubGlobal('fetch', fetchSpy);

    const { enqueuePdfJob } = await import('../pdf');

    await enqueuePdfJob(supabase, {
      jobId: 'job',
      offerId: 'offer',
      userId: 'user',
      storagePath: 'path',
      html: '<p>html</p>',
      usagePeriodStart: '2024-01-01',
      userLimit: null,
    });

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'refresh_pdf_jobs_schema_cache');
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'pgrest_schema_cache_reload');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/pgrest_schema_cache_reload');
    expect(init).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Profile': 'public',
        'Accept-Profile': 'public',
      }),
    });
  });

  it('downgrades premium templates for free plans and annotates metadata', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const profileMocks = createProfileSelectMock('free');

    const fromMock = vi.fn((table: string) => {
      if (table === 'pdf_jobs') {
        return { insert: insertMock };
      }
      if (table === 'profiles') {
        return { select: profileMocks.select };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const supabase = { from: fromMock, rpc: rpcMock } as unknown as SupabaseClient;

    const { enqueuePdfJob } = await import('../pdf');

    await enqueuePdfJob(supabase, {
      jobId: 'job-1',
      offerId: 'offer-1',
      userId: 'user-1',
      storagePath: 'path',
      html: '<p>html</p>',
      usagePeriodStart: '2024-01-01',
      userLimit: null,
      templateId: 'premium.elegant@1.1.0',
      requestedTemplateId: 'premium-banner',
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0]?.payload;
    expect(payload.templateId).toBe('free.base@1.1.0');
    expect(payload.metadata).toMatchObject({
      planTier: 'free',
      requestedTemplateId: 'premium.elegant@1.1.0',
      requestedTemplateRaw: 'premium-banner',
      enforcedTemplateId: 'free.base@1.1.0',
      originalTemplateId: 'premium.elegant@1.1.0',
    });
    expect(payload.metadata.notes?.[0]).toMatch(/requires a premium plan/i);
  });
});
