import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchWithSupabaseAuth, isAbortError } from '../api';

function createSupabase({
  token = 'test-token',
  sessionError = null as { message: string } | null,
}: {
  token?: string | null;
  sessionError?: { message: string } | null;
}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: token ? ({ access_token: token } as { access_token: string }) : null },
        error: sessionError,
      }),
    },
  } as unknown as SupabaseClient;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchWithSupabaseAuth', () => {
  it('attaches the bearer token to the request', async () => {
    const supabase = createSupabase({ token: 'abc123' });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithSupabaseAuth('/api/test', { supabase });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toBeDefined();
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('throws ApiError when session retrieval fails', async () => {
    const supabase = createSupabase({ token: null, sessionError: { message: 'session failed' } });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        supabase,
        authErrorMessage: 'Auth failed',
      }),
    ).rejects.toMatchObject({ message: 'Auth failed', status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('parses error message from JSON response', async () => {
    const supabase = createSupabase({});
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
        supabase,
        errorMessageBuilder: (status) => `Fallback (${status})`,
      }),
    ).rejects.toMatchObject({ message: 'Detailed error', status: 500 });
  });

  it('uses fallback message for non-JSON errors', async () => {
    const supabase = createSupabase({});
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('nope', { status: 502, headers: { 'Content-Type': 'text/plain' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        supabase,
        errorMessageBuilder: (status) => `Fallback (${status})`,
      }),
    ).rejects.toMatchObject({ message: 'Fallback (502)', status: 502 });
  });

  it('wraps network errors with default message', async () => {
    const supabase = createSupabase({});
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchWithSupabaseAuth('/api/test', {
        supabase,
        defaultErrorMessage: 'Nem sikerült elérni a szervert.',
      }),
    ).rejects.toMatchObject({ message: 'Nem sikerült elérni a szervert.' });
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
