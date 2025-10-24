/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

import type { PostgrestError } from '@supabase/supabase-js';

import {
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
  consumeMagicLinkRateLimit,
  hashMagicLinkEmailKey,
} from '../rateLimiter';

type RateLimitRow = {
  key: string;
  count: number;
  expires_at: string;
};

type RateLimitClient = Parameters<typeof consumeMagicLinkRateLimit>[0];

class FakeQueryBuilder {
  constructor(private readonly records: Map<string, RateLimitRow>) {}

  select() {
    return {
      eq: (_column: string, value: string) => ({
        maybeSingle: async () => ({
          data: this.records.get(value) ?? null,
          error: null,
        }),
      }),
    } as const;
  }

  upsert(record: RateLimitRow) {
    this.records.set(record.key, { ...record });
    return {
      select: () => ({
        single: async () => ({
          data: { ...this.records.get(record.key)! },
          error: null,
        }),
      }),
    } as const;
  }

  update(partial: Partial<RateLimitRow>) {
    return {
      eq: (_column: string, key: string) => {
        const existing = this.records.get(key);
        if (!existing) {
          throw new Error('Missing record');
        }

        const updated = { ...existing, ...partial } as RateLimitRow;
        this.records.set(key, updated);

        return {
          select: () => ({
            single: async () => ({
              data: { ...updated },
              error: null,
            }),
          }),
        } as const;
      },
    } as const;
  }

  delete() {
    return {
      eq: (_column: string, key: string) => {
        this.records.delete(key);
        return Promise.resolve({ data: null, error: null });
      },
    } as const;
  }
}

class FakeSupabaseClient {
  constructor(public readonly records = new Map<string, RateLimitRow>()) {}

  from() {
    return new FakeQueryBuilder(this.records);
  }
}

const EMAIL = 'user@example.com';
const LEGACY_KEY = `email:${EMAIL}`;
const HASHED_KEY = hashMagicLinkEmailKey(EMAIL);

function createClientWithErrors(options: {
  selectError?: string;
  upsertError?: string;
  updateError?: string;
  existing?: RateLimitRow | null;
}): RateLimitClient {
  const existing = options.existing ?? null;
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            options.selectError
              ? { data: null, error: { message: options.selectError } as PostgrestError }
              : { data: existing, error: null },
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: async () =>
            options.upsertError
              ? { data: null, error: { message: options.upsertError } as PostgrestError }
              : {
                  data: existing ?? {
                    key: HASHED_KEY,
                    count: 1,
                    expires_at: new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString(),
                  },
                  error: null,
                },
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () =>
              options.updateError
                ? { data: null, error: { message: options.updateError } as PostgrestError }
                : {
                    data: {
                      ...(existing ?? {
                        key: HASHED_KEY,
                        count: 0,
                        expires_at: new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString(),
                      }),
                      count: (existing?.count ?? 0) + 1,
                    },
                    error: null,
                  },
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  } as unknown as RateLimitClient;
}

describe('consumeMagicLinkRateLimit', () => {
  it('creates a new record when no entry exists', async () => {
    const now = Date.UTC(2024, 0, 1);
    const client = new FakeSupabaseClient();

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      HASHED_KEY,
      now,
      [LEGACY_KEY],
    );

    expect(result).toEqual({ allowed: true, retryAfterMs: RATE_LIMIT_WINDOW_MS });
    const stored = client.records.get(HASHED_KEY);
    expect(stored).toMatchObject({ count: 1 });
    expect(client.records.has(LEGACY_KEY)).toBe(false);
  });

  it('increments an existing record and blocks once the limit is exceeded', async () => {
    const now = Date.UTC(2024, 0, 1);
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    const records = new Map<string, RateLimitRow>();
    records.set(HASHED_KEY, {
      key: HASHED_KEY,
      count: RATE_LIMIT_MAX_ATTEMPTS,
      expires_at: expiresAt,
    });
    const client = new FakeSupabaseClient(records);

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      HASHED_KEY,
      now,
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
    expect(client.records.get(HASHED_KEY)?.count).toBe(RATE_LIMIT_MAX_ATTEMPTS + 1);
  });

  it('resets an expired record', async () => {
    const now = Date.UTC(2024, 0, 1);
    const records = new Map<string, RateLimitRow>();
    records.set(HASHED_KEY, {
      key: HASHED_KEY,
      count: 3,
      expires_at: new Date(now - 1_000).toISOString(),
    });
    const client = new FakeSupabaseClient(records);

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      HASHED_KEY,
      now,
    );

    expect(result.allowed).toBe(true);
    expect(client.records.get(HASHED_KEY)?.count).toBe(1);
  });

  it('migrates a legacy email key to the hashed format', async () => {
    const now = Date.UTC(2024, 0, 1);
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    const records = new Map<string, RateLimitRow>();
    records.set(LEGACY_KEY, {
      key: LEGACY_KEY,
      count: RATE_LIMIT_MAX_ATTEMPTS - 1,
      expires_at: expiresAt,
    });
    const client = new FakeSupabaseClient(records);

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      HASHED_KEY,
      now,
      [LEGACY_KEY],
    );

    expect(result.allowed).toBe(true);
    expect(client.records.get(HASHED_KEY)).toMatchObject({
      key: HASHED_KEY,
      count: RATE_LIMIT_MAX_ATTEMPTS,
      expires_at: expiresAt,
    });
    expect(client.records.has(LEGACY_KEY)).toBe(false);
  });

  it('propagates select errors', async () => {
    const client = createClientWithErrors({ selectError: 'select failed' });

    await expect(consumeMagicLinkRateLimit(client, HASHED_KEY, Date.now())).rejects.toMatchObject({
      message: 'select failed',
    });
  });

  it('propagates upsert errors', async () => {
    const client = createClientWithErrors({ upsertError: 'upsert failed' });

    await expect(consumeMagicLinkRateLimit(client, HASHED_KEY, Date.now())).rejects.toMatchObject({
      message: 'upsert failed',
    });
  });

  it('propagates update errors', async () => {
    const now = Date.now();
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    const client = createClientWithErrors({
      existing: { key: HASHED_KEY, count: 1, expires_at: expiresAt },
      updateError: 'update failed',
    });

    await expect(consumeMagicLinkRateLimit(client, HASHED_KEY, now)).rejects.toMatchObject({
      message: 'update failed',
    });
  });
});
