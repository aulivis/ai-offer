import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithSupabaseAuth, isAbortError } from '../api';

declare global {
  interface Document {
    cookie: string;
  }
}

describe('fetchWithSupabaseAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'XSRF-TOKEN=test.csrf',
      set: () => true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes credentials and CSRF header for POST requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithSupabaseAuth('/api/test', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe('include');
    const headers = init?.headers as Headers;
    expect(headers.get('x-csrf-token')).toBe('test.csrf');
  });

  it('parses error message from JSON response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Detailed error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        errorMessageBuilder: (status) => `Fallback (${status})`,
      }),
    ).rejects.toMatchObject({ message: 'Detailed error', status: 500 });
  });

  it('uses fallback message for non-JSON errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('nope', { status: 502, headers: { 'Content-Type': 'text/plain' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        errorMessageBuilder: (status) => `Fallback (${status})`,
      }),
    ).rejects.toMatchObject({ message: 'Fallback (502)', status: 502 });
  });

  it('wraps network errors with default message', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        defaultErrorMessage: 'Nem sikerült elérni a szervert.',
      }),
    ).rejects.toMatchObject({ message: 'Nem sikerült elérni a szervert.' });
  });

  it('attempts silent refresh on 401 responses', async () => {
    const successResponse = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const unauthorizedResponse = new Response(null, { status: 401 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(successResponse);
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchWithSupabaseAuth('/api/protected', { method: 'GET' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
  });

  it('throws auth error when refresh fails', async () => {
    const unauthorizedResponse = new Response(null, { status: 401 });
    const fetchMock = vi.fn().mockResolvedValue(unauthorizedResponse);
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/protected', {
        authErrorMessage: 'Auth failed',
      }),
    ).rejects.toMatchObject({ message: 'Auth failed', status: 401 });
  });
});

describe('isAbortError', () => {
  it('detects DOMException abort errors', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
  });

  it('detects generic abort errors', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAbortError(new Error('other'))).toBe(false);
  });
});
