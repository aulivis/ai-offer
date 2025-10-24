/* @vitest-environment node */

import { describe, expect, it } from 'vitest';

import type { PostgrestError } from '@supabase/supabase-js';

import {
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
  consumeMagicLinkRateLimit,
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
}

class FakeSupabaseClient {
  constructor(public readonly records = new Map<string, RateLimitRow>()) {}

  from() {
    return new FakeQueryBuilder(this.records);
  }
}

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
                  data:
                    existing ?? {
                      key: 'email:user@example.com',
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
                        key: 'email:user@example.com',
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
    }),
  } satisfies RateLimitClient;
}

describe('consumeMagicLinkRateLimit', () => {
  it('creates a new record when no entry exists', async () => {
    const now = Date.UTC(2024, 0, 1);
    const client = new FakeSupabaseClient();

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      'email:user@example.com',
      now,
    );

    expect(result).toEqual({ allowed: true, retryAfterMs: RATE_LIMIT_WINDOW_MS });
    const stored = client.records.get('email:user@example.com');
    expect(stored).toMatchObject({ count: 1 });
  });

  it('increments an existing record and blocks once the limit is exceeded', async () => {
    const now = Date.UTC(2024, 0, 1);
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    const records = new Map<string, RateLimitRow>();
    records.set('email:user@example.com', {
      key: 'email:user@example.com',
      count: RATE_LIMIT_MAX_ATTEMPTS,
      expires_at: expiresAt,
    });
    const client = new FakeSupabaseClient(records);

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      'email:user@example.com',
      now,
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
    expect(client.records.get('email:user@example.com')?.count).toBe(
      RATE_LIMIT_MAX_ATTEMPTS + 1,
    );
  });

  it('resets an expired record', async () => {
    const now = Date.UTC(2024, 0, 1);
    const records = new Map<string, RateLimitRow>();
    records.set('email:user@example.com', {
      key: 'email:user@example.com',
      count: 3,
      expires_at: new Date(now - 1_000).toISOString(),
    });
    const client = new FakeSupabaseClient(records);

    const result = await consumeMagicLinkRateLimit(
      client as unknown as RateLimitClient,
      'email:user@example.com',
      now,
    );

    expect(result.allowed).toBe(true);
    expect(client.records.get('email:user@example.com')?.count).toBe(1);
  });

  it('propagates select errors', async () => {
    const client = createClientWithErrors({ selectError: 'select failed' });

    await expect(
      consumeMagicLinkRateLimit(client, 'email:user@example.com', Date.now()),
    ).rejects.toMatchObject({ message: 'select failed' });
  });

  it('propagates upsert errors', async () => {
    const client = createClientWithErrors({ upsertError: 'upsert failed' });

    await expect(
      consumeMagicLinkRateLimit(client, 'email:user@example.com', Date.now()),
    ).rejects.toMatchObject({ message: 'upsert failed' });
  });

  it('propagates update errors', async () => {
    const now = Date.now();
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    const client = createClientWithErrors({
      existing: { key: 'email:user@example.com', count: 1, expires_at: expiresAt },
      updateError: 'update failed',
    });

    await expect(
      consumeMagicLinkRateLimit(client, 'email:user@example.com', now),
    ).rejects.toMatchObject({ message: 'update failed' });
  });
});
