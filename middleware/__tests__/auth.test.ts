/* @vitest-environment edge-runtime */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE_NAME, createCsrfToken } from '../../lib/auth/csrf';
import { withAuth } from '../auth';

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

vi.mock('@/env.client', () => ({
  envClient: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
  },
}));

describe('withAuth origin protection', () => {
  beforeEach(() => {
    getUserMock.mockReset();
  });

  it('allows requests from the configured application origin', async () => {
    const handler = withAuth((req) => NextResponse.json({ user: req.user }));
    const { token, value } = createCsrfToken();

    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: new Headers({
        'x-csrf-token': token,
        origin: 'http://localhost:3000',
        referer: 'http://localhost:3000/dashboard',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        cookie: `propono_at=test-token; ${CSRF_COOKIE_NAME}=${value}`,
      }),
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { id: 'user-1', email: 'user@example.com' },
    });
  });

  it('rejects forged cross-origin requests', async () => {
    const handler = withAuth(() => NextResponse.json({ ok: true }));
    const { token, value } = createCsrfToken();

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: new Headers({
        'x-csrf-token': token,
        origin: 'https://evil.com',
        referer: 'https://evil.com/attack',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'document',
        cookie: `propono_at=test-token; ${CSRF_COOKIE_NAME}=${value}`,
      }),
    });

    const response = await handler(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'A kérés forrása nincs engedélyezve.',
    });
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
