import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

type RpcResponse = { error: { message: string } | null };

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  OPENAI_API_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'sk_test',
  APP_URL: 'https://app.example.com',
  STRIPE_PRICE_ALLOWLIST: '',
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
      .fn<[], Promise<RpcResponse>>()
      .mockResolvedValueOnce({ error: { message: 'function refresh_pdf_jobs_schema_cache does not exist' } })
      .mockResolvedValueOnce({ error: null });

    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
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
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'pgrest.schema_cache_reload');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('performs HTTP schema cache reload when PostgREST RPC is unavailable', async () => {
    const insertMock = createInsertMock([
      { message: "Could not find the table 'public.pdf_jobs' in the schema cache" },
      null,
    ]);

    const rpcMock = vi
      .fn<[], Promise<RpcResponse>>()
      .mockResolvedValueOnce({ error: { message: 'function refresh_pdf_jobs_schema_cache does not exist' } })
      .mockResolvedValueOnce({ error: { message: 'function pgrest.schema_cache_reload does not exist' } });

    const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
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
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'pgrest.schema_cache_reload');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/pgrest.schema_cache_reload');
    expect(init).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Profile': 'public',
        'Accept-Profile': 'public',
      }),
    });
  });
});
