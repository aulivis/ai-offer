/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuthMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    SUPABASE_SERVICE_ROLE_KEY: 'role-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    OAUTH_REDIRECT_ALLOWLIST: ['http://localhost/dashboard'],
    APP_URL: 'http://localhost',
  },
}));

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
  });

  it('redirects to the provider and stores the OAuth state cookie', async () => {
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth', codeVerifier: 'code-123' },
      error: null,
    });

    const { GET } = await import('../google/route');
    const response = await GET(new Request('http://localhost/api/auth/google?redirect_to=http://localhost/dashboard'));

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('state=');
    expect(location).toContain('nonce=');
    expect(cookiesSetMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'auth_state' }));
  });
});
