/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCsrfToken } from '../../../../../../lib/auth/csrf';
import type { AuthenticatedNextRequest } from '../../../../../../middleware/auth';

const { createSessionMock, anonGetUserMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
  anonGetUserMock: vi.fn(),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-role',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    OPENAI_API_KEY: 'test-openai',
    STRIPE_SECRET_KEY: 'sk_test_123',
    APP_URL: 'http://localhost:3000',
    STRIPE_PRICE_ALLOWLIST: ['price_123'],
    PDF_WEBHOOK_ALLOWLIST: [],
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: anonGetUserMock,
    },
  }),
}));

vi.mock('@/env.client', () => ({
  envClient: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: {
        create: createSessionMock,
      },
    },
  })),
}));

const { POST, __test } = await import('../route');

function createRequest(
  body: Record<string, unknown>,
  options: { authenticated?: boolean; ip?: string } = {},
): AuthenticatedNextRequest {
  const { authenticated = true, ip } = options;
  const csrf = createCsrfToken();

  const cookies: Record<string, string> = {
    'XSRF-TOKEN': csrf.value,
  };
  if (authenticated) {
    cookies.propono_at = 'test-token';
  }

  const request = {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json', 'x-csrf-token': csrf.token }),
    json: vi.fn().mockResolvedValue(body),
    cookies: {
      get: (name: string) =>
        cookies[name as keyof typeof cookies]
          ? { name, value: cookies[name as keyof typeof cookies] }
          : undefined,
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      has: (name: string) => Boolean(cookies[name as keyof typeof cookies]),
    },
  } as unknown as AuthenticatedNextRequest & { ip?: string };

  if (ip) {
    request.ip = ip;
  }

  return request;
}

describe('Stripe checkout route', () => {
  beforeEach(() => {
    anonGetUserMock.mockReset();
    createSessionMock.mockReset();
    __test.resetRateLimiter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    const request = createRequest({ priceId: 'price_123', email: 'user@example.com' }, { authenticated: false });

    const response = await POST(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('A bejelentkezés lejárt'),
    });
    expect(anonGetUserMock).not.toHaveBeenCalled();
  });

  it('allows checkout for authenticated users with matching email', async () => {
    anonGetUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });
    createSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' });

    const request = createRequest(
      { priceId: 'price_123', email: 'user@example.com' },
      { authenticated: true, ip: '127.0.0.1' },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: 'https://checkout.stripe.com/test-session' });
    expect(anonGetUserMock).toHaveBeenCalledWith('test-token');
    expect(createSessionMock).toHaveBeenCalledWith({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: 'price_123', quantity: 1 }],
      customer_email: 'user@example.com',
      success_url: 'http://localhost:3000/billing?status=success',
      cancel_url: 'http://localhost:3000/billing?status=cancel',
    });
  });
});
