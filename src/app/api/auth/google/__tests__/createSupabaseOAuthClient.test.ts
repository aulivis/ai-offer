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

describe('createSupabaseOAuthClient', () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it('retrieves PKCE verifier stored with the Supabase storage key', async () => {
    const store = cookieStore;
    store.set('sb_sb-projectref-auth-token-code-verifier', 'verifier-value');

    const { createSupabaseOAuthClient } = await import('../createSupabaseOAuthClient');
    const { consumeCodeVerifier } = createSupabaseOAuthClient();

    await expect(consumeCodeVerifier()).resolves.toBe('verifier-value');
    expect(store.has('sb_sb-projectref-auth-token-code-verifier')).toBe(false);
  });
});
