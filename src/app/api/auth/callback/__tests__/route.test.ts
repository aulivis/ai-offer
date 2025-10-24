/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    OPENAI_API_KEY: 'test-openai',
    STRIPE_SECRET_KEY: 'stripe-secret',
    APP_URL: 'http://localhost:3000',
    STRIPE_PRICE_ALLOWLIST: [],
    OAUTH_REDIRECT_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: [],
  },
}));

vi.stubGlobal('fetch', fetchMock);

const { __test } = await import('../route');

describe('Supabase token exchange logging', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('logs structured error details with sanitized JSON bodies', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'invalid_grant',
          access_token: 'super-secret',
          nested: { refresh_token: 'also-secret' },
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    try {
      await expect(
        __test.exchangeCode({ code: 'test-code', codeVerifier: 'verifier' }),
      ).rejects.toThrow(/Supabase token exchange failed/);

      expect(consoleError).toHaveBeenCalledWith(
        'Supabase token exchange failed.',
        expect.objectContaining({
          status: 400,
          statusText: 'Bad Request',
          body: {
            error: 'invalid_grant',
            access_token: '[REDACTED]',
            nested: { refresh_token: '[REDACTED]' },
          },
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('logs sanitized text bodies without leaking tokens', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    fetchMock.mockResolvedValue(
      new Response('error=invalid_grant&token=secret-value', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    try {
      await expect(__test.exchangeCode({ code: 'test-code' })).rejects.toThrow(
        /Supabase token exchange failed/,
      );

      expect(consoleError).toHaveBeenCalledWith(
        'Supabase token exchange failed.',
        expect.objectContaining({
          status: 500,
          statusText: 'Internal Server Error',
          body: '[REDACTED SENSITIVE CONTENT]',
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
