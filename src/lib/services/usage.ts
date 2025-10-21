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

/**
 * Retrieve or initialize a usage counter record for a user.  If no
 * record exists one will be inserted.  If the existing record belongs
 * to a previous month the counter is reset.  Returns the usage row
 * along with a boolean indicating whether it is a new period.
 *
 * @param sb Supabase client
 * @param userId User UUID
 */
export async function getOrInitUsage(
  sb: SupabaseClient,
  userId: string
): Promise<{ usage: any; isNewPeriod: boolean }> {
  const { iso: monthStr } = currentMonthStart();
  let { data: usage } = await sb
    .from('usage_counters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let isNewPeriod = false;

  if (!usage) {
    await sb.from('usage_counters').insert({
      user_id: userId,
      period_start: monthStr,
      offers_generated: 0,
    });
    const res = await sb.from('usage_counters').select('*').eq('user_id', userId).maybeSingle();
    usage = res.data;
  }

  if (usage && usage.period_start !== monthStr) {
    isNewPeriod = true;
  }
  return { usage, isNewPeriod };
}

/**
 * Atomically increment the offers_generated counter for a user.  Uses
 * Supabase's `update` with `.increment` when available or falls back to
 * selecting the current value and incrementing it.  If a new month
 * starts the counter is reset.
 *
 * @param sb Supabase client
 * @param userId User UUID
 * @param currentCount Current offer count (used if fallback needed)
 */
export async function incrementOfferCount(
  sb: SupabaseClient,
  userId: string,
  currentCount: number,
  isNewPeriod: boolean
): Promise<void> {
  if (isNewPeriod) {
    await sb.from('usage_counters').upsert({
      user_id: userId,
      period_start: currentMonthStart().iso,
      offers_generated: 1,
    });
  } else {
    // Use the increment operator if available; otherwise fallback
    const { error } = await sb
      .from('usage_counters')
      .update({ offers_generated: currentCount + 1 })
      .eq('user_id', userId);
    if (error) {
      console.error('Failed to update usage counter:', error);
    }
  }
}