/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuthMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());
const consumeCodeVerifierMock = vi.hoisted(() => vi.fn());

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

vi.mock('@/env.server', () => ({
  envServer: {
    SUPABASE_SERVICE_ROLE_KEY: 'role-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    OAUTH_REDIRECT_ALLOWLIST: ['http://localhost/dashboard'],
    APP_URL: 'http://localhost',
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
    const response = await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'));

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
    await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/settings'));

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
    const response = await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to start Google authentication.' });
  });

  it('returns an error when Supabase omits the state parameter', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?nonce=nonce-only' },
      error: null,
    });

    const { GET } = await import('../google/route');
    const response = await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to start Google authentication.' });
    expect(consumeCodeVerifierMock).not.toHaveBeenCalled();
  });

  it('returns an error when Supabase omits the nonce parameter', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=state-only' },
      error: null,
    });

    const { GET } = await import('../google/route');
    const response = await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to start Google authentication.' });
    expect(consumeCodeVerifierMock).not.toHaveBeenCalled();
  });
});
