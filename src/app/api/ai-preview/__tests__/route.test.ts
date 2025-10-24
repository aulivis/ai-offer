/* @vitest-environment node */

import { EventEmitter } from 'node:events';
import { TextDecoder } from 'node:util';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCsrfToken } from '../../../../../lib/auth/csrf';
import type { AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { POST } from '../route';

const { streamMock, anonGetUserMock } = vi.hoisted(() => ({
  streamMock: vi.fn(),
  anonGetUserMock: vi.fn(),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    OPENAI_API_KEY: 'test-key',
    STRIPE_SECRET_KEY: 'stripe-key',
    APP_URL: 'http://localhost',
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
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  },
}));

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    responses: {
      stream: streamMock,
    },
  })),
}));

class FakeStream extends EventEmitter {
  aborted = false;
  abortReason: unknown = null;

  constructor(private readonly options: { throwOnAbort?: boolean } = {}) {
    super();
  }

  abort(reason?: unknown) {
    this.aborted = true;
    this.abortReason = reason;
    if (this.options.throwOnAbort) {
      throw new Error('abort failed');
    }
    this.emit('abort', reason ?? new Error('aborted'));
  }
}

function createRequest(overrides: Record<string, unknown> = {}): AuthenticatedNextRequest {
  const { token: csrfToken, value: csrfCookie } = createCsrfToken();
  const cookies = {
    propono_at: 'test-token',
    'XSRF-TOKEN': csrfCookie,
  } satisfies Record<string, string>;

  const payload = {
    industry: 'Tech',
    title: 'Sample',
    description: 'Desc',
    deadline: '2024-01-01',
    language: 'hu',
    brandVoice: 'friendly',
    style: 'detailed',
    ...overrides,
  };

  return {
    method: 'POST',
    headers: new Headers({ 'x-csrf-token': csrfToken }),
    json: vi.fn().mockResolvedValue(payload),
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

function parseSse(raw: string) {
  return raw
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const data = chunk.replace(/^data:\s*/, '');
      return JSON.parse(data);
    });
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  streamMock.mockReset();
  anonGetUserMock.mockReset();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  anonGetUserMock.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'user@example.com' } },
    error: null,
  });
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
  consoleErrorSpy = null;
  vi.useRealTimers();
});

describe('ai-preview route streaming', () => {
  it('returns validation errors for malformed input', async () => {
    const response = await POST(createRequest({ title: '   ', industry: '', description: '' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Érvénytelen kérés.',
      issues: expect.objectContaining({
        fieldErrors: expect.objectContaining({ title: expect.any(Array) }),
      }),
    });

    expect(streamMock).not.toHaveBeenCalled();
  });

  it('aborts hung streams after the configured timeout', async () => {
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((callback: TimerHandler) => {
        if (typeof callback === 'function') {
          (callback as (...args: unknown[]) => void)();
        }
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});

    try {
      const fakeStream = new FakeStream();
      streamMock.mockResolvedValue(fakeStream);

      const response = await POST(createRequest());
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      const decoder = new TextDecoder();
      const chunks: string[] = [];
      const consume = (async () => {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          chunks.push(decoder.decode(value, { stream: true }));
        }
        return chunks.join('');
      })();

      const raw = await consume;

      expect(fakeStream.aborted).toBe(true);
      const events = parseSse(raw);
      const lastEvent = events[events.length - 1];
      expect(lastEvent).toMatchObject({ type: 'error' });
      expect(JSON.stringify(lastEvent)).toContain('idő');

      expect(fakeStream.listenerCount('response.output_text.delta')).toBe(0);
      expect(fakeStream.listenerCount('end')).toBe(0);
      expect(fakeStream.listenerCount('abort')).toBe(0);
      expect(fakeStream.listenerCount('error')).toBe(0);
      expect(anonGetUserMock).toHaveBeenCalledWith('test-token');
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });

  it('cleans up listeners even when abort throws during cancel', async () => {
    const fakeStream = new FakeStream({ throwOnAbort: true });
    streamMock.mockResolvedValue(fakeStream);

    const response = await POST(createRequest());
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    await reader!.cancel(new Error('client abort'));

    expect(fakeStream.aborted).toBe(true);
    expect(fakeStream.listenerCount('response.output_text.delta')).toBe(0);
    expect(fakeStream.listenerCount('end')).toBe(0);
    expect(fakeStream.listenerCount('abort')).toBe(0);
    expect(fakeStream.listenerCount('error')).toBe(0);
  });
});
