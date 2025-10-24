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

type CounterKind = 'user' | 'device';

type CounterTargets = {
  user: { userId: string };
  device: { userId: string; deviceId: string };
};

const COUNTER_CONFIG: {
  [K in CounterKind]: {
    table: string;
    columnMap: { [P in keyof CounterTargets[K]]: string };
    rpc: 'check_and_increment_usage' | 'check_and_increment_device_usage';
  };
} = {
  user: {
    table: 'usage_counters',
    columnMap: { userId: 'user_id' },
    rpc: 'check_and_increment_usage',
  },
  device: {
    table: 'device_usage_counters',
    columnMap: { userId: 'user_id', deviceId: 'device_id' },
    rpc: 'check_and_increment_device_usage',
  },
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

type UsageState = { periodStart: string; offersGenerated: number };

async function ensureUsageCounter<K extends CounterKind>(
  sb: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  periodStart: string
): Promise<UsageState> {
  const { table, columnMap } = COUNTER_CONFIG[kind];
  let selectBuilder = sb
    .from(table)
    .select('period_start, offers_generated');

  (Object.entries(columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
    selectBuilder = selectBuilder.eq(column, target[key]);
  });

  const { data: existing, error: selectError } = await selectBuilder.maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Failed to load usage counter: ${selectError.message}`);
  }

  let usageRow = existing;
  if (!usageRow) {
    const insertPayload: Record<string, unknown> = {
      period_start: periodStart,
      offers_generated: 0,
    };
    (Object.entries(columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      insertPayload[column] = target[key];
    });
    const { data: inserted, error: insertError } = await sb
      .from(table)
      .insert(insertPayload)
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
    let updateBuilder = sb
      .from(table)
      .update({ period_start: periodStart, offers_generated: 0 });
    (Object.entries(columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    });
    const { data: resetRow, error: resetError } = await updateBuilder.select('period_start, offers_generated').maybeSingle();
    if (resetError) {
      throw new Error(`Failed to reset usage counter: ${resetError.message}`);
    }
    currentPeriod = normalizeDate(resetRow?.period_start, periodStart);
    generated = Number(resetRow?.offers_generated ?? 0);
  }

  return { periodStart: currentPeriod, offersGenerated: generated };
}

async function fallbackUsageUpdate<K extends CounterKind>(
  sb: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string
): Promise<QuotaCheckResult> {
  const { table, columnMap } = COUNTER_CONFIG[kind];
  const state = await ensureUsageCounter(sb, kind, target, periodStart);
  const { periodStart: currentPeriod, offersGenerated } = state;

  if (typeof limit === 'number' && Number.isFinite(limit) && offersGenerated >= limit) {
    return { allowed: false, offersGenerated, periodStart: currentPeriod };
  }

  let updateBuilder = sb
    .from(table)
    .update({ offers_generated: offersGenerated + 1, period_start: currentPeriod });
  (Object.entries(columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
    updateBuilder = updateBuilder.eq(column, target[key]);
  });
  const { data: updatedRow, error: updateError } = await updateBuilder.select('period_start, offers_generated').maybeSingle();
  if (updateError) {
    throw new Error(`Failed to bump usage counter: ${updateError.message}`);
  }

  const finalPeriod = normalizeDate(updatedRow?.period_start, currentPeriod);
  const finalCount = Number(updatedRow?.offers_generated ?? offersGenerated + 1);

  return { allowed: true, offersGenerated: finalCount, periodStart: finalPeriod };
}

export async function getUsageSnapshot(
  sb: SupabaseClient,
  userId: string,
  periodStartOverride?: string
): Promise<UsageState> {
  const periodStart = typeof periodStartOverride === 'string' && periodStartOverride
    ? normalizeDate(periodStartOverride, currentMonthStart().iso)
    : currentMonthStart().iso;
  return ensureUsageCounter(sb, 'user', { userId }, periodStart);
}

export async function getDeviceUsageSnapshot(
  sb: SupabaseClient,
  userId: string,
  deviceId: string,
  periodStartOverride?: string
): Promise<UsageState> {
  const periodStart = typeof periodStartOverride === 'string' && periodStartOverride
    ? normalizeDate(periodStartOverride, currentMonthStart().iso)
    : currentMonthStart().iso;
  return ensureUsageCounter(sb, 'device', { userId, deviceId }, periodStart);
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
  limit: number | null,
  periodStartOverride?: string
): Promise<QuotaCheckResult> {
  const { iso: defaultPeriod } = currentMonthStart();
  const periodStart = typeof periodStartOverride === 'string' && periodStartOverride
    ? normalizeDate(periodStartOverride, defaultPeriod)
    : defaultPeriod;
  const rpcPayload = {
    p_user_id: userId,
    p_limit: Number.isFinite(limit ?? NaN) ? limit : null,
    p_period_start: periodStart,
  } as const;

  const { data, error } = await sb.rpc('check_and_increment_usage', rpcPayload);
  if (error) {
    const message = error.message ?? '';
    if (message.toLowerCase().includes('check_and_increment_usage')) {
      return fallbackUsageUpdate(
        sb,
        'user',
        { userId },
        Number.isFinite(limit ?? NaN) ? limit : null,
        periodStart,
      );
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

export async function checkAndIncrementDeviceUsage(
  sb: SupabaseClient,
  userId: string,
  deviceId: string,
  limit: number | null,
  periodStartOverride?: string
): Promise<QuotaCheckResult> {
  const { iso: defaultPeriod } = currentMonthStart();
  const periodStart = typeof periodStartOverride === 'string' && periodStartOverride
    ? normalizeDate(periodStartOverride, defaultPeriod)
    : defaultPeriod;
  const rpcPayload = {
    p_user_id: userId,
    p_device_id: deviceId,
    p_limit: Number.isFinite(limit ?? NaN) ? limit : null,
    p_period_start: periodStart,
  } as const;

  const { data, error } = await sb.rpc('check_and_increment_device_usage', rpcPayload);
  if (error) {
    const message = error.message ?? '';
    if (message.toLowerCase().includes('check_and_increment_device_usage')) {
      return fallbackUsageUpdate(
        sb,
        'device',
        { userId, deviceId },
        Number.isFinite(limit ?? NaN) ? limit : null,
        periodStart,
      );
    }
    throw new Error(`Failed to update device usage counter: ${message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };
}

export async function rollbackUsageIncrement(sb: SupabaseClient, userId: string, expectedPeriod: string) {
  const { data: existing, error } = await sb
    .from('usage_counters')
    .select('offers_generated, period_start')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load usage counter for rollback', error);
    return;
  }

  if (!existing) {
    return;
  }

  const currentCount = Number(existing.offers_generated ?? 0);
  if (currentCount <= 0) {
    return;
  }

  const periodStart = normalizeDate(existing.period_start, expectedPeriod);
  if (periodStart !== expectedPeriod) {
    return;
  }

  const { error: updateError } = await sb
    .from('usage_counters')
    .update({ offers_generated: currentCount - 1 })
    .eq('user_id', userId);

  if (updateError) {
    console.warn('Failed to rollback usage counter increment', updateError);
  }
}

