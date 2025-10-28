/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const getGoogleProviderStatusMock = vi.hoisted(() => vi.fn().mockResolvedValue({ enabled: true }));

vi.mock('../google/providerStatus', () => ({
  getGoogleProviderStatus: getGoogleProviderStatusMock,
}));

describe('GET /api/auth/google/status', () => {
  it('returns the provider status payload', async () => {
    getGoogleProviderStatusMock.mockResolvedValue({ enabled: true });

    const { GET } = await import('../google/status/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
  });

  it('propagates the disabled status', async () => {
    getGoogleProviderStatusMock.mockResolvedValue({
      enabled: false,
      message: 'provider disabled',
    });

    const { GET } = await import('../google/status/route');
    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ enabled: false, message: 'provider disabled' });
  });
});
