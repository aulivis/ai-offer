/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesStoreMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const verifyOtpMock = vi.hoisted(() => vi.fn());
const setAuthCookiesMock = vi.hoisted(() => vi.fn());
const setCSRFCookieMock = vi.hoisted(() => vi.fn());
const recordMagicLinkCallbackMock = vi.hoisted(() => vi.fn());

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    MAGIC_LINK_RATE_LIMIT_SALT: '0123456789abcdef',
    OPENAI_API_KEY: 'test-openai',
    STRIPE_SECRET_KEY: 'test-stripe',
    APP_URL: 'http://localhost',
    PUBLIC_CONTACT_EMAIL: 'hello@example.com',
    STRIPE_PRICE_ALLOWLIST: [],
    OAUTH_REDIRECT_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: [],
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookiesStoreMock),
}));

vi.mock('@/lib/observability/authLogging', () => ({
  createAuthRequestLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    setEmail: vi.fn(),
  }),
}));

vi.mock('@/lib/observability/metrics', () => ({
  recordMagicLinkCallback: recordMagicLinkCallbackMock,
}));

vi.mock('../../../../../lib/auth/cookies', () => ({
  setAuthCookies: setAuthCookiesMock,
  setCSRFCookie: setCSRFCookieMock,
}));

vi.mock('../../../lib/supabaseAnonServer', () => ({
  supabaseAnonServer: () => ({
    auth: {
      verifyOtp: verifyOtpMock,
    },
  }),
}));

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.resetModules();
    cookiesStoreMock.get.mockReset();
    cookiesStoreMock.set.mockReset();
    verifyOtpMock.mockReset();
    setAuthCookiesMock.mockReset();
    setCSRFCookieMock.mockReset();
    recordMagicLinkCallbackMock.mockReset();
  });

  it('verifies magic link token hashes when no authorization code is present', async () => {
    verifyOtpMock.mockResolvedValue({
      data: { session: { access_token: 'access-123', refresh_token: 'refresh-456' } },
      error: null,
    });

    const { GET } = await import('../callback/route');
    const response = await GET(
      new Request('http://localhost/api/auth/callback?token_hash=token-hash&type=magiclink'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: 'token-hash', type: 'magiclink' });
    expect(setAuthCookiesMock).toHaveBeenCalledWith('access-123', 'refresh-456');
    expect(setCSRFCookieMock).toHaveBeenCalled();
    expect(recordMagicLinkCallbackMock).toHaveBeenCalledWith('success');
  });
});
