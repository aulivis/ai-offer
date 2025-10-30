import type { SupabaseClient } from '@supabase/supabase-js';

import { countPendingPdfJobs } from '../queue/pdf';
import { getMonthlyOfferLimit, resolveEffectivePlan } from '../subscription';

/**
 * Compute the first day of the current month in YYYY-MM-DD format.  This
 * helper is used to determine the billing period for usage counters.
 */
export function currentMonthStart(): { date: Date; iso: string } {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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

type PeriodSource = { period_start?: unknown; created_at?: unknown } | null | undefined;

function resolveStoredPeriod(row: PeriodSource, fallback: string): string {
  if (row && row.period_start) {
    return normalizeDate(row.period_start, fallback);
  }

  if (row && row.created_at) {
    return normalizeDate(row.created_at, fallback);
  }

  return fallback;
}

async function ensureUsageCounter<K extends CounterKind>(
  sb: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  periodStart: string,
): Promise<UsageState> {
  const { table, columnMap } = COUNTER_CONFIG[kind];
  let selectBuilder = sb.from(table).select('period_start, offers_generated, created_at');

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
      .select('period_start, offers_generated, created_at')
      .maybeSingle();
    if (insertError) {
      throw new Error(`Failed to initialise usage counter: ${insertError.message}`);
    }
    usageRow = inserted ?? { period_start: periodStart, offers_generated: 0 };
  }

  let currentPeriod = resolveStoredPeriod(usageRow, periodStart);
  let generated = Number(usageRow?.offers_generated ?? 0);

  if (currentPeriod !== periodStart) {
    let updateBuilder = sb.from(table).update({ period_start: periodStart, offers_generated: 0 });
    (Object.entries(columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    });
    const { data: resetRow, error: resetError } = await updateBuilder
      .select('period_start, offers_generated, created_at')
      .maybeSingle();
    if (resetError) {
      throw new Error(`Failed to reset usage counter: ${resetError.message}`);
    }
    currentPeriod = resolveStoredPeriod(resetRow, periodStart);
    generated = Number(resetRow?.offers_generated ?? 0);
  }

  return { periodStart: currentPeriod, offersGenerated: generated };
}

async function fallbackUsageUpdate<K extends CounterKind>(
  sb: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string,
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
  const { data: updatedRow, error: updateError } = await updateBuilder
    .select('period_start, offers_generated, created_at')
    .maybeSingle();
  if (updateError) {
    throw new Error(`Failed to bump usage counter: ${updateError.message}`);
  }

  const finalPeriod = resolveStoredPeriod(updatedRow, currentPeriod);
  const finalCount = Number(updatedRow?.offers_generated ?? offersGenerated + 1);

  return { allowed: true, offersGenerated: finalCount, periodStart: finalPeriod };
}

export async function getUsageSnapshot(
  sb: SupabaseClient,
  userId: string,
  periodStartOverride?: string,
): Promise<UsageState> {
  const periodStart =
    typeof periodStartOverride === 'string' && periodStartOverride
      ? normalizeDate(periodStartOverride, currentMonthStart().iso)
      : currentMonthStart().iso;
  return ensureUsageCounter(sb, 'user', { userId }, periodStart);
}

type UsageWithPendingParams = {
  userId: string;
  periodStart: string;
  deviceId?: string | null;
};

export type UsageWithPendingSnapshot = {
  limit: number | null;
  confirmed: number;
  pendingUser: number;
  pendingDevice: number | null;
  remaining: number | null;
  periodStart: string;
};

export async function getUsageWithPending(
  sb: SupabaseClient,
  params: UsageWithPendingParams,
): Promise<UsageWithPendingSnapshot> {
  const { userId, periodStart, deviceId } = params;
  const { iso: defaultPeriod } = currentMonthStart();
  const normalizedPeriod = normalizeDate(periodStart, defaultPeriod);

  const [{ data: profile, error: profileError }, usageState] = await Promise.all([
    sb.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    ensureUsageCounter(sb, 'user', { userId }, normalizedPeriod),
  ]);

  if (profileError) {
    throw new Error(`Failed to load profile for usage snapshot: ${profileError.message}`);
  }

  const plan = resolveEffectivePlan((profile?.plan as string | null) ?? null);
  const limit = getMonthlyOfferLimit(plan);

  const confirmed = Number.isFinite(usageState.offersGenerated) ? usageState.offersGenerated : 0;

  let pendingUser = 0;
  let pendingDevice: number | null = null;

  pendingUser = await countPendingPdfJobs(sb, {
    userId,
    periodStart: usageState.periodStart,
  });

  if (deviceId) {
    pendingDevice = await countPendingPdfJobs(sb, {
      userId,
      periodStart: usageState.periodStart,
      deviceId,
    });
  }

  const remaining =
    typeof limit === 'number' && Number.isFinite(limit)
      ? Math.max(limit - confirmed - pendingUser, 0)
      : null;

  return {
    limit,
    confirmed,
    pendingUser,
    pendingDevice,
    remaining,
    periodStart: usageState.periodStart,
  };
}

export async function syncUsageCounter(
  sb: SupabaseClient,
  userId: string,
  expectedUsage: number,
  periodStartOverride?: string,
): Promise<void> {
  const normalizedExpected = Number.isFinite(expectedUsage ?? NaN)
    ? Math.max(0, Math.floor(expectedUsage))
    : 0;
  const periodStart =
    typeof periodStartOverride === 'string' && periodStartOverride
      ? normalizeDate(periodStartOverride, currentMonthStart().iso)
      : currentMonthStart().iso;

  const state = await ensureUsageCounter(sb, 'user', { userId }, periodStart);

  if (state.periodStart !== periodStart) {
    const alignedCount = Math.min(state.offersGenerated, normalizedExpected);
    if (state.periodStart !== periodStart || state.offersGenerated !== alignedCount) {
      const { error } = await sb
        .from('usage_counters')
        .update({
          period_start: periodStart,
          offers_generated: alignedCount,
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to sync usage counter: ${error.message}`);
      }
    }
    return;
  }

  if (state.offersGenerated === normalizedExpected) {
    return;
  }

  console.info('Skipping usage counter sync due to observed usage drift', {
    userId,
    expected: normalizedExpected,
    stored: state.offersGenerated,
    periodStart,
  });
}

export async function getDeviceUsageSnapshot(
  sb: SupabaseClient,
  userId: string,
  deviceId: string,
  periodStartOverride?: string,
): Promise<UsageState> {
  const periodStart =
    typeof periodStartOverride === 'string' && periodStartOverride
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
  periodStartOverride?: string,
): Promise<QuotaCheckResult> {
  const { iso: defaultPeriod } = currentMonthStart();
  const periodStart =
    typeof periodStartOverride === 'string' && periodStartOverride
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
  const resolvedPeriod = normalizeDate(result?.period_start, periodStart);
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: resolvedPeriod,
  };
}

export async function checkAndIncrementDeviceUsage(
  sb: SupabaseClient,
  userId: string,
  deviceId: string,
  limit: number | null,
  periodStartOverride?: string,
): Promise<QuotaCheckResult> {
  const { iso: defaultPeriod } = currentMonthStart();
  const periodStart =
    typeof periodStartOverride === 'string' && periodStartOverride
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
  const resolvedPeriod = normalizeDate(result?.period_start, periodStart);
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: resolvedPeriod,
  };
}

type RollbackOptions = { deviceId?: string | null };

export async function rollbackUsageIncrement(
  sb: SupabaseClient,
  userId: string,
  expectedPeriod: string,
  options: RollbackOptions = {},
) {
  const isDevice = typeof options.deviceId === 'string' && options.deviceId.length > 0;
  const table = isDevice ? 'device_usage_counters' : 'usage_counters';

  let selectBuilder = sb
    .from(table)
    .select('offers_generated, period_start, created_at')
    .eq('user_id', userId);

  if (isDevice) {
    selectBuilder = selectBuilder.eq('device_id', options.deviceId);
  }

  const { data: existing, error } = await selectBuilder.maybeSingle();

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

  const periodStart = resolveStoredPeriod(existing, expectedPeriod);
  if (periodStart !== expectedPeriod) {
    return;
  }

  let updateBuilder = sb
    .from(table)
    .update({ offers_generated: currentCount - 1 })
    .eq('user_id', userId);

  if (isDevice) {
    updateBuilder = updateBuilder.eq('device_id', options.deviceId);
  }

  const { error: updateError } = await updateBuilder;

  if (updateError) {
    console.warn('Failed to rollback usage counter increment', updateError);
  }
}
