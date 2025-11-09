/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => new Map<string, string>());

const cookiesMock = vi.hoisted(() =>
  vi.fn(() => {
    const store = cookieStore;

    function normalizeArgs(
      nameOrOptions: string | { name: string; value: string; maxAge?: number },
      value?: string,
      options?: { maxAge?: number },
    ) {
      if (typeof nameOrOptions === 'string') {
        return {
          name: nameOrOptions,
          value: value ?? '',
          maxAge: options?.maxAge,
        };
      }
      return nameOrOptions;
    }

    return {
      get(name: string) {
        const value = store.get(name);
        return value ? { name, value } : undefined;
      },
      set(
        nameOrOptions: string | { name: string; value: string; maxAge?: number },
        value?: string,
        options?: { maxAge?: number },
      ) {
        const cookie = normalizeArgs(nameOrOptions, value, options);
        if (cookie.maxAge === 0) {
          store.delete(cookie.name);
        } else {
          store.set(cookie.name, cookie.value);
        }
      },
      getAll() {
        return Array.from(store.entries()).map(([name, value]) => ({ name, value }));
      },
    };
  }),
);

const providerStatusMock = vi.hoisted(() => vi.fn());
const signInWithOAuthMock = vi.hoisted(() => vi.fn());
const consumeCodeVerifierMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://projectref.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    MAGIC_LINK_RATE_LIMIT_SALT: 'magic-link-rate-limit-salt',
    OPENAI_API_KEY: 'test-openai-key',
    STRIPE_SECRET_KEY: 'stripe-secret-key',
    APP_URL: 'http://localhost:3000',
    PUBLIC_CONTACT_EMAIL: 'hello@example.com',
    STRIPE_PRICE_ALLOWLIST: [],
    OAUTH_REDIRECT_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: [],
    SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
  },
}));

vi.mock('../providerStatus', () => ({
  getGoogleProviderStatus: providerStatusMock,
}));

vi.mock('../createSupabaseOAuthClient', () => ({
  createSupabaseOAuthClient: () => ({
    client: {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
      },
    },
    consumeCodeVerifier: consumeCodeVerifierMock,
  }),
}));

const { GET } = await import('../route');

describe('GET /api/auth/google', () => {
  beforeEach(() => {
    cookieStore.clear();
    providerStatusMock.mockReset();
    signInWithOAuthMock.mockReset();
    consumeCodeVerifierMock.mockReset();
  });

  it('redirects to Supabase and stores the PKCE verifier cookie', async () => {
    providerStatusMock.mockResolvedValue({ enabled: true });
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://supabase.example.com/auth?state=state-value&nonce=nonce-value' },
      error: null,
    });
    consumeCodeVerifierMock.mockResolvedValue('verifier-token');

    const response = await GET(
      new Request('http://localhost:3000/api/auth/google?redirect_to=/dashboard'),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://supabase.example.com/auth?state=state-value&nonce=nonce-value',
    );

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo:
          'http://localhost:3000/api/auth/callback?redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fdashboard',
        skipBrowserRedirect: true,
      },
    });

    expect(cookieStore.get('sb_pkce_code_verifier')).toBe('verifier-token');
    expect(cookieStore.get('auth_state')).toMatch(/^state-value:/);
    expect(signInWithOAuthMock.mock.invocationCallOrder[0]).toBeLessThan(
      consumeCodeVerifierMock.mock.invocationCallOrder[0],
    );
  });

  it('generates a state parameter when Supabase omits it', async () => {
    providerStatusMock.mockResolvedValue({ enabled: true });
    signInWithOAuthMock.mockResolvedValue({
      data: { url: 'https://supabase.example.com/auth?nonce=nonce-value' },
      error: null,
    });
    consumeCodeVerifierMock.mockResolvedValue('verifier-token');

    const response = await GET(
      new Request('http://localhost:3000/api/auth/google?redirect_to=/dashboard'),
    );

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();

    const redirectedUrl = location ? new URL(location) : null;
    expect(redirectedUrl?.origin).toBe('https://supabase.example.com');
    expect(redirectedUrl?.pathname).toBe('/auth');
    expect(redirectedUrl?.searchParams.get('nonce')).toBe('nonce-value');

    const generatedState = redirectedUrl?.searchParams.get('state');
    expect(generatedState).toBeTruthy();

    const authStateCookie = cookieStore.get('auth_state');
    expect(authStateCookie).toBeTruthy();
    if (generatedState) {
      expect(authStateCookie?.split(':')[0]).toBe(generatedState);
    }
  });
});
