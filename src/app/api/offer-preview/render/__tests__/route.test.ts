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

function createRequest(rawBody = '{'): AuthenticatedNextRequest {
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
    text: vi.fn().mockResolvedValue(rawBody),
    json: vi.fn(),
    signal: { aborted: false } as AbortSignal,
    cookies: {
      get: (name: string) =>
        cookies[name as keyof typeof cookies]
          ? { name, value: cookies[name as keyof typeof cookies] }
          : undefined,
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      has: (name: string) => Boolean(cookies[name as keyof typeof cookies]),
    },
    // Type assertion is necessary because NextRequest is a complex class
    // and we're creating a partial mock with only the properties we need for tests.
    // This is safe because we control which properties are accessed in the tests.
  } as AuthenticatedNextRequest;
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

  it('returns 499 when the request body is aborted mid-stream', async () => {
    const request = createRequest();
    // Type assertion is safe because we're adding a mock method to the request object
    (request as { text: ReturnType<typeof vi.fn> }).text = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The user aborted a request.', 'AbortError'));
    Object.assign(request, { signal: { aborted: true } as AbortSignal });

    const response = await POST(request);

    expect(response.status).toBe(499);
  });
});
