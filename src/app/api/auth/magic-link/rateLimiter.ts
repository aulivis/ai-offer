import { createHash } from 'node:crypto';

import type { PostgrestError } from '@supabase/supabase-js';

import type { supabaseServer } from '@/app/lib/supabaseServer';
import { envServer } from '@/env.server';

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

const MAGIC_LINK_EMAIL_PREFIX = 'email:';

export function hashMagicLinkEmailKey(email: string) {
  const digest = createHash('sha256')
    .update(envServer.MAGIC_LINK_RATE_LIMIT_SALT)
    .update(email)
    .digest('hex');

  return `${MAGIC_LINK_EMAIL_PREFIX}${digest}`;
}

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

type ExistingLookupResult = {
  data: RateLimitRow | null;
  error: PostgrestError | null;
  key: string | null;
};

async function findExisting(
  table: RateLimitTable,
  key: string,
  legacyKeys: readonly string[],
): Promise<ExistingLookupResult> {
  const primary = await selectExisting(table, key);
  if (primary.error) {
    return { data: null, error: primary.error, key: null };
  }

  if (primary.data) {
    return { data: primary.data, error: null, key };
  }

  for (const legacyKey of legacyKeys) {
    const legacy = await selectExisting(table, legacyKey);
    if (legacy.error) {
      return { data: null, error: legacy.error, key: null };
    }

    if (legacy.data) {
      return { data: legacy.data, error: null, key: legacyKey };
    }
  }

  return { data: null, error: null, key: null };
}

async function upsertFromLegacy(
  table: RateLimitTable,
  key: string,
  count: number,
  expiresAt: string,
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table
    .upsert({ key, count, expires_at: expiresAt }, { onConflict: 'key' })
    .select('key, count, expires_at')
    .single();
}

async function deleteLegacy(
  table: RateLimitTable,
  key: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await table.delete().eq('key', key);
  return { error };
}

export async function consumeMagicLinkRateLimit(
  client: RateLimitClient,
  key: string,
  now = Date.now(),
  legacyKeys: string[] = [],
): Promise<RateLimitResult> {
  const table = client.from<RateLimitRow>('magic_link_rate_limits') as RateLimitTable;

  const { data: existing, error: selectError, key: existingKey } = await findExisting(
    table,
    key,
    legacyKeys,
  );
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
  } else if (existingKey === key) {
    const nextCount = (existing?.count ?? 0) + 1;
    const { data, error } = await updateExisting(table, key, nextCount);
    if (error) {
      throw error;
    }
    result = data;
  } else if (existing) {
    const nextCount = (existing.count ?? 0) + 1;
    const { data, error } = await upsertFromLegacy(table, key, nextCount, existing.expires_at);
    if (error) {
      throw error;
    }
    result = data;
  }

  if (existing && existingKey && existingKey !== key) {
    const { error } = await deleteLegacy(table, existingKey);
    if (error) {
      throw error;
    }
  }

  const retryAfterMs = Math.max(0, parseExpiresAt(result?.expires_at) - nowMs);
  const attempts = result?.count ?? 0;

  return {
    allowed: attempts <= RATE_LIMIT_MAX_ATTEMPTS,
    retryAfterMs,
  };
}
