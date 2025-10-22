/* @vitest-environment node */

import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createSessionMock, getUserMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-role',
    OPENAI_API_KEY: 'test-openai',
    STRIPE_SECRET_KEY: 'sk_test_123',
    APP_URL: 'http://localhost:3000',
    STRIPE_PRICE_ALLOWLIST: ['price_123'],
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
  options: { headers?: Record<string, string>; ip?: string } = {},
): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json', ...options.headers });
  const request = {
    headers,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest & { ip?: string };
  if (options.ip) {
    request.ip = options.ip;
  }
  return request;
}

describe('Stripe checkout route', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    createSessionMock.mockReset();
    __test.resetRateLimiter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    const request = createRequest({ priceId: 'price_123', email: 'user@example.com' });

    const response = await POST(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('be kell jelentkezned'),
    });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('allows checkout for authenticated users with matching email', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } }, error: null });
    createSessionMock.mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' });

    const request = createRequest(
      { priceId: 'price_123', email: 'user@example.com' },
      { headers: { authorization: 'Bearer test-token' }, ip: '127.0.0.1' },
    );

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: 'https://checkout.stripe.com/test-session' });
    expect(getUserMock).toHaveBeenCalledWith('test-token');
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
