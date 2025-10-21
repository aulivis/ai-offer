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
    throw new Error(`Failed to update usage counter: ${error.message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };
}

