/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());
const setSessionMock = vi.hoisted(() => vi.fn());
const linkIdentityMock = vi.hoisted(() => vi.fn());

vi.mock('../google/createSupabaseOAuthClient', () => ({
  createSupabaseOAuthClient: () => ({
    client: {
      auth: {
        setSession: setSessionMock,
        linkIdentity: linkIdentityMock,
      },
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    SUPABASE_SERVICE_ROLE_KEY: 'role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    OAUTH_REDIRECT_ALLOWLIST: ['http://localhost/dashboard'],
    APP_URL: 'http://localhost',
    PDF_WEBHOOK_ALLOWLIST: [],
    PUBLIC_CONTACT_EMAIL: 'hello@example.com',
  },
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

describe('GET /api/auth/google/link', () => {
  beforeEach(() => {
    vi.resetModules();
    setSessionMock.mockReset();
    linkIdentityMock.mockReset();
    cookiesMock.mockResolvedValue({
      get(name: string) {
        if (name === 'propono_at') {
          return { value: 'access-token' };
        }
        if (name === 'propono_rt') {
          return { value: 'refresh-token' };
        }
        return undefined;
      },
    });
    setSessionMock.mockResolvedValue({ error: null });
    linkIdentityMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });
  });

  it('requires an active session', async () => {
    cookiesMock.mockResolvedValue({
      get() {
        return undefined;
      },
    });

    const { GET } = await import('../google/link/route');
    const response = await GET(new Request('http://localhost/api/auth/google/link'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Aktív bejelentkezés szükséges a fiók összekapcsolásához.',
    });
  });

  it('redirects to Google when linking can start', async () => {
    const { GET } = await import('../google/link/route');
    const response = await GET(new Request('http://localhost/api/auth/google/link'));

    expect(setSessionMock).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(linkIdentityMock).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: 'http://localhost/settings?link=google_success',
      }),
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://accounts.google.com/o/oauth2/v2/auth');
  });

  it('falls back to an error redirect when linking cannot start', async () => {
    linkIdentityMock.mockResolvedValue({ data: { url: null }, error: new Error('No url') });

    const { GET } = await import('../google/link/route');
    const response = await GET(new Request('http://localhost/api/auth/google/link'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('http://localhost/settings?link=google_error');
  });
});
