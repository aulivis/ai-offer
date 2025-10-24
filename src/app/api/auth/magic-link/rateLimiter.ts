import type { PostgrestError } from '@supabase/supabase-js';

import type { supabaseServer } from '@/app/lib/supabaseServer';

export const RATE_LIMIT_MAX_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

type RateLimitRow = {
  key: string;
  count: number;
  expires_at: string;
};

type SupabaseServerClient = ReturnType<typeof supabaseServer>;
type RateLimitTable = ReturnType<SupabaseServerClient['from']>;

type RateLimitClient = Pick<SupabaseServerClient, 'from'>;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

function parseExpiresAt(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function selectExisting(
  table: RateLimitTable,
  key: string
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table.select('key, count, expires_at').eq('key', key).maybeSingle();
}

async function upsertFresh(
  table: RateLimitTable,
  key: string,
  expiresAt: string
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table
    .upsert({ key, count: 1, expires_at: expiresAt }, { onConflict: 'key' })
    .select('key, count, expires_at')
    .single();
}

async function updateExisting(
  table: RateLimitTable,
  key: string,
  count: number
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table
    .update({ count })
    .eq('key', key)
    .select('key, count, expires_at')
    .single();
}

export async function consumeMagicLinkRateLimit(
  client: RateLimitClient,
  key: string,
  now = Date.now()
): Promise<RateLimitResult> {
  const table = client.from<RateLimitRow>('magic_link_rate_limits') as RateLimitTable;

  const { data: existing, error: selectError } = await selectExisting(table, key);
  if (selectError) {
    throw selectError;
  }

  const expiresAt = parseExpiresAt(existing?.expires_at);
  const nowMs = now;
  const shouldReset = !existing || expiresAt <= nowMs;
  const nextExpiresAt = new Date(nowMs + RATE_LIMIT_WINDOW_MS).toISOString();

  let result: RateLimitRow | null = null;
  if (shouldReset) {
    const { data, error } = await upsertFresh(table, key, nextExpiresAt);
    if (error) {
      throw error;
    }
    result = data;
  } else {
    const nextCount = (existing?.count ?? 0) + 1;
    const { data, error } = await updateExisting(table, key, nextCount);
    if (error) {
      throw error;
    }
    result = data;
  }

  const retryAfterMs = Math.max(0, parseExpiresAt(result?.expires_at) - nowMs);
  const attempts = result?.count ?? 0;

  return {
    allowed: attempts <= RATE_LIMIT_MAX_ATTEMPTS,
    retryAfterMs,
  };
}
