/* @vitest-environment node */

import { EventEmitter } from 'node:events';
import { TextDecoder } from 'node:util';

import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { streamMock, getUserMock } = vi.hoisted(() => ({
  streamMock: vi.fn(),
  getUserMock: vi.fn(),
}));

import { POST, STREAM_TIMEOUT_MS } from '../route';

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
    OPENAI_API_KEY: 'test-key',
    STRIPE_SECRET_KEY: 'stripe-key',
    APP_URL: 'http://localhost',
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

function createRequest(overrides: Record<string, unknown> = {}): NextRequest {
  const headers = new Headers({ authorization: 'Bearer test-token' });
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
    headers,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as NextRequest;
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
  getUserMock.mockReset();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
  consoleErrorSpy = null;
  vi.useRealTimers();
});

describe('ai-preview route streaming', () => {
  it('aborts hung streams after the configured timeout', async () => {
    vi.useFakeTimers();
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

    await vi.advanceTimersByTimeAsync(STREAM_TIMEOUT_MS);
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
    expect(getUserMock).toHaveBeenCalledWith('test-token');
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
