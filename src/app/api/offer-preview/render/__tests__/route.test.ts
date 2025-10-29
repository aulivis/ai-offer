/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCsrfToken } from '../../../../../../lib/auth/csrf';
import type { AuthenticatedNextRequest } from '../../../../../../middleware/auth';
import { POST } from '../route';

const supabaseGetUserMock = vi.hoisted(() => vi.fn());

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    AUTH_COOKIE_SECRET: 'auth-cookie-secret-value-auth-cookie-secret-value',
    CSRF_SECRET: 'csrf-secret-value-csrf-secret-value',
    OPENAI_API_KEY: 'test-openai-key',
    STRIPE_SECRET_KEY: 'stripe-secret-key',
    APP_URL: 'http://localhost:3000',
    STRIPE_PRICE_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: [],
    PUBLIC_CONTACT_EMAIL: 'hello@example.com',
  },
}));

vi.mock('@/env.client', () => ({
  envClient: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: supabaseGetUserMock,
    },
  }),
}));

function createRequest(): AuthenticatedNextRequest {
  const { token: csrfToken, value: csrfCookie } = createCsrfToken();
  const cookies = {
    propono_at: 'test-token',
    'XSRF-TOKEN': csrfCookie,
  } satisfies Record<string, string>;

  const headers = new Headers({
    'x-csrf-token': csrfToken,
    origin: 'http://localhost:3000',
    referer: 'http://localhost:3000/app',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'accept-language': 'hu',
  });

  return {
    method: 'POST',
    headers,
    json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    cookies: {
      get: (name: string) =>
        cookies[name as keyof typeof cookies]
          ? { name, value: cookies[name as keyof typeof cookies] }
          : undefined,
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      has: (name: string) => Boolean(cookies[name as keyof typeof cookies]),
    },
  } as unknown as AuthenticatedNextRequest;
}

describe('offer preview render POST', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    supabaseGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy?.mockRestore();
    consoleWarnSpy = null;
  });

  it('returns a validation error when the JSON body cannot be parsed', async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Érvénytelen előnézeti kérés.',
      issues: {
        fieldErrors: {},
        formErrors: ['Érvénytelen JSON törzs.'],
      },
    });
  });
});
