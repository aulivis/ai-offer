/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtpMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());
const generateLinkMock = vi.hoisted(() => vi.fn());

const adminMock = vi.hoisted(() => ({
  signInWithOtp: signInWithOtpMock as undefined | typeof signInWithOtpMock,
  generateLink: generateLinkMock as undefined | typeof generateLinkMock,
  createUser: createUserMock,
}));

vi.mock('@/env.server', () => ({
  envServer: {
    APP_URL: 'https://app.example.com',
  },
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      admin: adminMock,
    },
  }),
}));

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    signInWithOtpMock.mockReset();
    createUserMock.mockReset();
    generateLinkMock.mockReset();
    createUserMock.mockResolvedValue({ error: null });
    adminMock.signInWithOtp = signInWithOtpMock;
    adminMock.generateLink = generateLinkMock;
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
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: 'https://app.example.com/api/auth/callback' },
    });
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
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'exists@example.com',
      options: { emailRedirectTo: 'https://app.example.com/api/auth/callback' },
    });
  });

  it('falls back to generateLink when signInWithOtp is unavailable', async () => {
    adminMock.signInWithOtp = undefined;
    adminMock.generateLink = generateLinkMock;
    generateLinkMock.mockResolvedValue(undefined);

    const { POST } = await import('../magic-link/route');
    const response = await POST(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'fallback@example.com' }),
      }),
    );

    expect(response.status).toBe(202);
    expect(createUserMock).toHaveBeenCalledWith({
      email: 'fallback@example.com',
      email_confirm: false,
    });
    expect(generateLinkMock).toHaveBeenCalledWith({
      email: 'fallback@example.com',
      type: 'magiclink',
      options: { emailRedirectTo: 'https://app.example.com/api/auth/callback' },
    });
  });
});
