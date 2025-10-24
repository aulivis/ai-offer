/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOtpMock = vi.hoisted(() => vi.fn());
const anonSignInWithOtpMock = vi.hoisted(() => vi.fn());
const generateLinkMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());

const adminMock = vi.hoisted(() => ({
  signInWithOtp: signInWithOtpMock as undefined | typeof signInWithOtpMock,
  generateLink: generateLinkMock as undefined | typeof generateLinkMock,
}));

const anonClientMock = vi.hoisted(() => ({
  auth: {
    signInWithOtp: anonSignInWithOtpMock as undefined | typeof anonSignInWithOtpMock,
  },
}));

vi.mock('@/env.server', () => ({
  envServer: {
    APP_URL: 'https://app.example.com',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  },
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      admin: adminMock,
    },
    from: vi.fn(),
  }),
}));

vi.mock('@/app/lib/supabaseAnonServer', () => ({
  supabaseAnonServer: () => anonClientMock,
}));

vi.mock('../magic-link/rateLimiter', () => ({
  consumeMagicLinkRateLimit: consumeRateLimitMock,
}));

describe('POST /api/auth/magic-link', () => {
  beforeEach(() => {
    vi.resetModules();
    signInWithOtpMock.mockReset();
    anonSignInWithOtpMock.mockReset();
    generateLinkMock.mockReset();
    consumeRateLimitMock.mockReset();
    adminMock.signInWithOtp = signInWithOtpMock;
    adminMock.generateLink = generateLinkMock;
    anonClientMock.auth.signInWithOtp = anonSignInWithOtpMock;
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
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
    expect(anonSignInWithOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: {
        emailRedirectTo: 'https://app.example.com/api/auth/callback',
        shouldCreateUser: true,
      },
    });
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it('falls back to the admin client when the anon client is unavailable', async () => {
    anonClientMock.auth.signInWithOtp = undefined;
    signInWithOtpMock.mockResolvedValue(undefined);

    const { POST } = await import('../magic-link/route');
    const response = await POST(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com' }),
      }),
    );

    expect(response.status).toBe(202);
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'admin@example.com',
      options: {
        emailRedirectTo: 'https://app.example.com/api/auth/callback',
        shouldCreateUser: true,
      },
    });
  });

  it('falls back to generateLink when signInWithOtp is unavailable', async () => {
    anonClientMock.auth.signInWithOtp = undefined;
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
    expect(generateLinkMock).toHaveBeenCalledWith({
      email: 'fallback@example.com',
      type: 'magiclink',
      options: {
        emailRedirectTo: 'https://app.example.com/api/auth/callback',
        shouldCreateUser: true,
      },
    });
  });

  it('does not send a link when the rate limit is exceeded', async () => {
    consumeRateLimitMock
      .mockResolvedValueOnce({ allowed: false, retryAfterMs: 5000 })
      .mockResolvedValueOnce({ allowed: true, retryAfterMs: 0 });

    const { POST } = await import('../magic-link/route');
    const response = await POST(
      new Request('http://localhost/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'limited@example.com' }),
      }),
    );

    expect(response.status).toBe(202);
    expect(anonSignInWithOtpMock).not.toHaveBeenCalled();
    expect(signInWithOtpMock).not.toHaveBeenCalled();
    expect(generateLinkMock).not.toHaveBeenCalled();
  });
});
