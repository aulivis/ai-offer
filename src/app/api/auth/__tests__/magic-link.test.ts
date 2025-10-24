/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtpMock = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      admin: { signInWithOtp: signInWithOtpMock },
    },
  }),
}));

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    signInWithOtpMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a generic success message', async () => {
    const { POST } = await import('../magic-link/route');
    const response = await POST(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      message: 'If an account exists for that email, a magic link will arrive shortly.',
    });
    expect(signInWithOtpMock).toHaveBeenCalledWith({ email: 'user@example.com' });
  });
});
