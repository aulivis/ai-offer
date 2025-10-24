/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  },
}));

describe('getGoogleProviderStatus', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    // @ts-expect-error – assign test double
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns enabled when Supabase reports the provider as active', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ external: { google: { enabled: true } } }),
    });

    const { getGoogleProviderStatus, invalidateGoogleProviderStatusCache } = await import(
      '../providerStatus'
    );

    invalidateGoogleProviderStatusCache();
    const status = await getGoogleProviderStatus(true);

    expect(status).toEqual({ enabled: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports disabled when Supabase indicates the provider is off', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ external: { google: { enabled: false } } }),
    });

    const { getGoogleProviderStatus, invalidateGoogleProviderStatusCache } = await import(
      '../providerStatus'
    );

    invalidateGoogleProviderStatusCache();
    const status = await getGoogleProviderStatus(true);

    expect(status.enabled).toBe(false);
    expect(status.message).toMatch(/nincs engedélyezve/i);
  });

  it('returns a descriptive error when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    const { getGoogleProviderStatus, invalidateGoogleProviderStatusCache } = await import(
      '../providerStatus'
    );

    invalidateGoogleProviderStatusCache();
    const status = await getGoogleProviderStatus(true);

    expect(status.enabled).toBe(false);
    expect(status.message).toMatch(/nem sikerült ellenőrizni/i);
  });
});
