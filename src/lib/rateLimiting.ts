import type { PostgrestError } from '@supabase/supabase-js';

import type { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

export const RATE_LIMIT_MAX_REQUESTS = 5;
export const RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitRow = {
  key: string;
  count: number;
  expires_at: string;
};

type SupabaseServerClient = ReturnType<typeof supabaseServiceRole>;
type RateLimitTable = ReturnType<SupabaseServerClient['from']>;

type RateLimitClient = Pick<SupabaseServerClient, 'from'>;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
  limit: number;
  resetAt: number;
};

function parseExpiresAt(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function selectExisting(
  table: RateLimitTable,
  key: string,
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table.select('key, count, expires_at').eq('key', key).maybeSingle();
}

async function upsertFresh(
  table: RateLimitTable,
  key: string,
  expiresAt: string,
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table
    .upsert({ key, count: 1, expires_at: expiresAt }, { onConflict: 'key' })
    .select('key, count, expires_at')
    .single();
}

async function incrementExisting(
  table: RateLimitTable,
  key: string,
  currentCount: number,
): Promise<{ data: RateLimitRow | null; error: PostgrestError | null }> {
  return table
    .update({ count: currentCount + 1 })
    .eq('key', key)
    .select('key, count, expires_at')
    .single();
}

export async function consumeRateLimit(
  client: RateLimitClient,
  key: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const table = client.from('api_rate_limits') as RateLimitTable;

  const { data: existing, error: selectError } = await selectExisting(table, key);
  if (selectError) {
    throw selectError;
  }

  const expiresAt = parseExpiresAt(existing?.expires_at);
  const nowMs = now;
  const shouldReset = !existing || expiresAt <= nowMs;
  const nextExpiresAt = new Date(nowMs + windowMs).toISOString();

  let result: RateLimitRow | null = null;
  if (shouldReset) {
    const { data, error } = await upsertFresh(table, key, nextExpiresAt);
    if (error) {
      throw error;
    }
    result = data;
  } else {
    const currentCount = existing?.count ?? 0;
    const { data, error } = await incrementExisting(table, key, currentCount);
    if (error) {
      throw error;
    }
    result = data;
  }

  const resetAt = parseExpiresAt(result?.expires_at);
  const attempts = result?.count ?? 0;
  const retryAfterMs = Math.max(0, resetAt - nowMs);
  const remaining = Math.max(0, maxRequests - attempts);

  return {
    allowed: attempts <= maxRequests,
    retryAfterMs,
    remaining,
    limit: maxRequests,
    resetAt,
  };
}

export function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

