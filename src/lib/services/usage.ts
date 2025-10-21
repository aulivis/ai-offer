import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Compute the first day of the current month in YYYY-MM-DD format.  This
 * helper is used to determine the billing period for usage counters.
 */
export function currentMonthStart(): { date: Date; iso: string } {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  const iso = date.toISOString().slice(0, 10);
  return { date, iso };
}

export type QuotaCheckResult = {
  allowed: boolean;
  offersGenerated: number;
  periodStart: string;
};

function normalizeDate(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return fallback;
}

async function fallbackUsageUpdate(
  sb: SupabaseClient,
  userId: string,
  limit: number | null,
  periodStart: string
): Promise<QuotaCheckResult> {
  const { data: existing, error: selectError } = await sb
    .from('usage_counters')
    .select('period_start, offers_generated')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Failed to load usage counter: ${selectError.message}`);
  }

  let usageRow = existing;
  if (!usageRow) {
    const { data: inserted, error: insertError } = await sb
      .from('usage_counters')
      .insert({ user_id: userId, period_start: periodStart, offers_generated: 0 })
      .select('period_start, offers_generated')
      .maybeSingle();
    if (insertError) {
      throw new Error(`Failed to initialise usage counter: ${insertError.message}`);
    }
    usageRow = inserted ?? { period_start: periodStart, offers_generated: 0 };
  }

  let currentPeriod = normalizeDate(usageRow?.period_start, periodStart);
  let generated = Number(usageRow?.offers_generated ?? 0);

  if (currentPeriod !== periodStart) {
    const { data: resetRow, error: resetError } = await sb
      .from('usage_counters')
      .update({ period_start: periodStart, offers_generated: 0 })
      .eq('user_id', userId)
      .select('period_start, offers_generated')
      .maybeSingle();
    if (resetError) {
      throw new Error(`Failed to reset usage counter: ${resetError.message}`);
    }
    currentPeriod = normalizeDate(resetRow?.period_start, periodStart);
    generated = Number(resetRow?.offers_generated ?? 0);
  }

  if (typeof limit === 'number' && Number.isFinite(limit) && generated >= limit) {
    return { allowed: false, offersGenerated: generated, periodStart: currentPeriod };
  }

  const { data: updatedRow, error: updateError } = await sb
    .from('usage_counters')
    .update({ offers_generated: generated + 1, period_start: currentPeriod })
    .eq('user_id', userId)
    .select('period_start, offers_generated')
    .maybeSingle();
  if (updateError) {
    throw new Error(`Failed to bump usage counter: ${updateError.message}`);
  }

  const finalPeriod = normalizeDate(updatedRow?.period_start, currentPeriod);
  const finalCount = Number(updatedRow?.offers_generated ?? generated + 1);

  return { allowed: true, offersGenerated: finalCount, periodStart: finalPeriod };
}

/**
 * Invoke the database RPC that performs an atomic quota check and, when
 * permitted, increments the user's monthly offer counter.  The RPC takes
 * care of initializing the usage row, resetting it on a new billing
 * period, and enforcing the provided limit.
 */
export async function checkAndIncrementUsage(
  sb: SupabaseClient,
  userId: string,
  limit: number | null
): Promise<QuotaCheckResult> {
  const { iso: periodStart } = currentMonthStart();
  const rpcPayload = {
    p_user_id: userId,
    p_limit: Number.isFinite(limit ?? NaN) ? limit : null,
    p_period_start: periodStart,
  } as const;

  const { data, error } = await sb.rpc('check_and_increment_usage', rpcPayload);
  if (error) {
    const message = error.message ?? '';
    if (message.toLowerCase().includes('check_and_increment_usage')) {
      return fallbackUsageUpdate(sb, userId, Number.isFinite(limit ?? NaN) ? limit : null, periodStart);
    }
    throw new Error(`Failed to update usage counter: ${message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };
}

