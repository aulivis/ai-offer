/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuthMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());
const consumeCodeVerifierMock = vi.hoisted(() => vi.fn());
const getGoogleProviderStatusMock = vi.hoisted(() => vi.fn().mockResolvedValue({ enabled: true }));

vi.mock('../google/createSupabaseOAuthClient', () => ({
  createSupabaseOAuthClient: () => ({
    client: {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
      },
    },
    consumeCodeVerifier: consumeCodeVerifierMock,
  }),
}));

vi.mock('../google/providerStatus', () => ({
  getGoogleProviderStatus: getGoogleProviderStatusMock,
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

import { envServer } from '@/env.server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: cookiesSetMock,
  })),
}));

describe('GET /api/auth/google', () => {
  beforeEach(() => {
    vi.resetModules();
    signInWithOAuthMock.mockReset();
    cookiesSetMock.mockReset();
    consumeCodeVerifierMock.mockReset();
    getGoogleProviderStatusMock.mockReset();
    getGoogleProviderStatusMock.mockResolvedValue({ enabled: true });
    envServer.OAUTH_REDIRECT_ALLOWLIST = ['http://localhost/dashboard'];
  });

  it('redirects to the provider and stores the OAuth state cookie', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-123&nonce=nonce-123',
      },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue('code-123');

    const { GET } = await import('../google/route');
    const response = await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'),
    );

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('state=');
    expect(location).toContain('nonce=');
    expect(cookiesSetMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'auth_state' }));
  });

  it('falls back to the default redirect when the requested target is not allowed', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-456&nonce=nonce-456',
      },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue('code-456');

    envServer.OAUTH_REDIRECT_ALLOWLIST = ['http://localhost/dashboard'];

    const { GET } = await import('../google/route');
    await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/profile'));

    expect(signInWithOAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ redirectTo: 'http://localhost/dashboard' }),
      }),
    );
  });

  it('allows redirects on the same origin when no allowlist is configured', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-789&nonce=nonce-789',
      },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue('code-789');

    envServer.OAUTH_REDIRECT_ALLOWLIST = [];

    const { GET } = await import('../google/route');
    await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/settings'),
    );

    expect(signInWithOAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ redirectTo: 'http://localhost/settings' }),
      }),
    );
  });

  it('returns an error when the PKCE code verifier is unavailable', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-000&nonce=nonce-000',
      },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue(null);

    const { GET } = await import('../google/route');
    const response = await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to start Google authentication.' });
  });

  it('blocks the flow when the Google provider is disabled', async () => {
    getGoogleProviderStatusMock.mockResolvedValue({
      enabled: false,
      message: 'The provider is disabled.',
    });

    const { GET } = await import('../google/route');
    const response = await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'The provider is disabled.' });
    expect(signInWithOAuthMock).not.toHaveBeenCalled();
  });

  it('generates a state parameter when Supabase omits it', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?nonce=nonce-only' },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue('code-321');

    const { GET } = await import('../google/route');
    const response = await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'),
    );

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('nonce=nonce-only');
    expect(location).toContain('state=');
    expect(consumeCodeVerifierMock).toHaveBeenCalled();

    const redirectUrl = location ? new URL(location) : null;
    const generatedState = redirectUrl?.searchParams.get('state');
    expect(generatedState).toBeTruthy();

    const authStateCall = cookiesSetMock.mock.calls.find(
      ([options]) => options?.name === 'auth_state',
    );
    expect(authStateCall).toBeTruthy();
    if (authStateCall && generatedState) {
      const [options] = authStateCall as [{ name: string; value: string }];
      expect(options.value.startsWith(`${generatedState}:`)).toBe(true);
    }
  });

  it('generates a nonce parameter when Supabase omits it', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-only' },
      error: null,
    });
    consumeCodeVerifierMock.mockReturnValue('code-654');

    const { GET } = await import('../google/route');
    const response = await GET(
      new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'),
    );

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('state=state-only');
    expect(location).toContain('nonce=');
    expect(consumeCodeVerifierMock).toHaveBeenCalled();
  });
});
