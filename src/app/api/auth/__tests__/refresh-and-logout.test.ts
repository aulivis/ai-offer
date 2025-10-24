/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyMock = vi.hoisted(() => vi.fn());
const hashMock = vi.hoisted(() => vi.fn());
const supabaseServerMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../lib/auth/argon2', () => ({
  Argon2Algorithm: { Argon2id: 'argon2id' },
  argon2Verify: verifyMock,
  argon2Hash: hashMock,
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: supabaseServerMock,
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    PDF_WEBHOOK_ALLOWLIST: [],
  },
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

const cookieStore = new Map<string, string>();

let selectEqMock: ReturnType<typeof vi.fn>;
let updateCalls: Array<{ values: Record<string, unknown>; column: string; value: string }>;
let insertCalls: Array<Record<string, unknown>>;

function createRefreshToken(sub: string, expiresInSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub, iat: now, exp: now + expiresInSeconds }),
  ).toString('base64url');
  return `${header}.${payload}.signature`;
}

beforeEach(() => {
  vi.resetModules();
  cookieStore.clear();
  selectEqMock = vi.fn();
  updateCalls = [];
  insertCalls = [];

  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      cookieStore.has(name)
        ? { name, value: cookieStore.get(name)! }
        : undefined,
    set: ({ name, value }: { name: string; value: string }) => {
      cookieStore.set(name, value);
    },
    getAll: () => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
  });

  updateMock.mockImplementation((values: Record<string, unknown>) => ({
    eq: vi.fn((column: string, value: string) => {
      updateCalls.push({ values, column, value });
      return Promise.resolve({ error: null });
    }),
  }));

  insertMock.mockImplementation((payload: Record<string, unknown>) => {
    insertCalls.push(payload);
    return Promise.resolve({ error: null });
  });

  supabaseServerMock.mockReturnValue({
    from: () => ({
      select: () => ({ eq: selectEqMock }),
      update: updateMock,
      insert: insertMock,
    }),
  });

  verifyMock.mockReset();
  hashMock.mockReset();
  updateMock.mockClear();
  insertMock.mockClear();
  supabaseServerMock.mockClear();
  cookiesMock.mockClear();

  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token and revokes the previous session', async () => {
    const oldToken = createRefreshToken('user-1', 3600);
    cookieStore.set('propono_rt', oldToken);

    verifyMock.mockResolvedValue(true);
    hashMock.mockResolvedValue('hashed-new');

    const sessionRow = {
      id: 'session-1',
      user_id: 'user-1',
      rt_hash: 'stored-hash',
      revoked_at: null,
    } satisfies SessionRow;

    selectEqMock.mockResolvedValue({ data: [sessionRow], error: null });

    const newRefreshToken = createRefreshToken('user-1', 7200);
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'new-access', refresh_token: newRefreshToken }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const { POST } = await import('../refresh/route');
    const response = await POST(new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: new Headers({ 'user-agent': 'vitest' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });

    expect(cookieStore.get('propono_at')).toBe('new-access');
    expect(cookieStore.get('propono_rt')).toBe(newRefreshToken);

    expect(hashMock).toHaveBeenCalledWith(newRefreshToken, expect.any(Object));
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({
      user_id: 'user-1',
      rotated_from: 'session-1',
      rt_hash: 'hashed-new',
    });
    expect(updateCalls.some((call) => call.column === 'id' && call.value === 'session-1')).toBe(true);
  });

  it('detects refresh token reuse and revokes all sessions', async () => {
    const reusedToken = createRefreshToken('user-2', 3600);
    cookieStore.set('propono_rt', reusedToken);

    verifyMock.mockResolvedValue(false);
    selectEqMock.mockResolvedValue({
      data: [
        { id: 'session-a', user_id: 'user-2', rt_hash: 'hash-a', revoked_at: null },
        { id: 'session-b', user_id: 'user-2', rt_hash: 'hash-b', revoked_at: null },
      ],
      error: null,
    });

    const { POST } = await import('../refresh/route');
    const response = await POST(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Refresh token reuse detected' });
    expect(updateCalls.some((call) => call.column === 'user_id' && call.value === 'user-2')).toBe(true);
    expect(cookieStore.get('propono_rt')).toBe('');
    expect(cookieStore.get('propono_at')).toBe('');
    expect(fetch as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 403 when CSRF validation fails', async () => {
    const { POST } = await import('../logout/route');

    const response = await POST(new Request('http://localhost/api/auth/logout', { method: 'POST' }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Érvénytelen vagy hiányzó CSRF token.' });
    expect(supabaseServerMock).not.toHaveBeenCalled();
  });
});

type SessionRow = {
  id: string;
  user_id: string;
  rt_hash: string;
  revoked_at: string | null;
};
