/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtpMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      admin: { signInWithOtp: signInWithOtpMock, createUser: createUserMock },
    },
  }),
}));

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    signInWithOtpMock.mockReset();
    createUserMock.mockReset();
    createUserMock.mockResolvedValue({ error: null });
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
    expect(createUserMock).toHaveBeenCalledWith({ email: 'user@example.com', email_confirm: false });
    expect(signInWithOtpMock).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('continues when the Supabase user already exists', async () => {
    createUserMock.mockResolvedValue({
      error: { message: 'User already registered' },
    });
    signInWithOtpMock.mockResolvedValue(undefined);

    const { POST } = await import('../magic-link/route');
    const response = await POST(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'exists@example.com' }),
      }),
    );

    expect(response.status).toBe(202);
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'exists@example.com',
      email_confirm: false,
    });
    expect(signInWithOtpMock).toHaveBeenCalledWith({ email: 'exists@example.com' });
  });
});
