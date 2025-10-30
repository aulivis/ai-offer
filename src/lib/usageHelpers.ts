import type { SupabaseClient } from '@supabase/supabase-js';

type CounterKind = 'user' | 'device';

type CounterTargets = {
  user: { userId: string };
  device: { userId: string; deviceId: string };
};

type UsageConfig<K extends CounterKind> = {
  table: 'usage_counters' | 'device_usage_counters';
  columnMap: { [P in keyof CounterTargets[K]]: string };
  rpc: 'check_and_increment_usage' | 'check_and_increment_device_usage';
};

const COUNTER_CONFIG: { [K in CounterKind]: UsageConfig<K> } = {
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

export type UsageCounterState = { periodStart: string; offersGenerated: number };

export type UsageIncrementResult = {
  allowed: boolean;
  offersGenerated: number;
  periodStart: string;
};

export type RollbackOptions = { deviceId?: string | null };

export function normalizeDate(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const timestamp = Date.parse(`${trimmed}T00:00:00Z`);
        if (!Number.isNaN(timestamp)) {
          return new Date(timestamp).toISOString().slice(0, 10);
        }
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
  }

  return fallback;
}

function buildSelectQuery<K extends CounterKind>(
  supabase: SupabaseClient,
  config: UsageConfig<K>,
  target: CounterTargets[K],
) {
  let builder = supabase.from(config.table).select('period_start, offers_generated');
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
    builder = builder.eq(column, target[key]);
  });
  return builder;
}

async function ensureUsageCounter<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  periodStart: string,
): Promise<UsageCounterState> {
  const config = COUNTER_CONFIG[kind];
  const selectBuilder = buildSelectQuery(supabase, config, target);
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
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      insertPayload[column] = target[key];
    });
    const { data: inserted, error: insertError } = await supabase
      .from(config.table)
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
    let updateBuilder = supabase
      .from(config.table)
      .update({ period_start: periodStart, offers_generated: 0 });
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    });
    const { data: resetRow, error: resetError } = await updateBuilder
      .select('period_start, offers_generated')
      .maybeSingle();
    if (resetError) {
      throw new Error(`Failed to reset usage counter: ${resetError.message}`);
    }
    currentPeriod = normalizeDate(resetRow?.period_start, periodStart);
    generated = Number(resetRow?.offers_generated ?? 0);
  }

  return { periodStart: currentPeriod, offersGenerated: generated };
}

async function fallbackIncrement<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string,
): Promise<UsageIncrementResult> {
  const config = COUNTER_CONFIG[kind];
  const state = await ensureUsageCounter(supabase, kind, target, periodStart);

  if (typeof limit === 'number' && Number.isFinite(limit) && state.offersGenerated >= limit) {
    return {
      allowed: false,
      offersGenerated: state.offersGenerated,
      periodStart: state.periodStart,
    };
  }

  let updateBuilder = supabase
    .from(config.table)
    .update({ offers_generated: state.offersGenerated + 1, period_start: state.periodStart });
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
    updateBuilder = updateBuilder.eq(column, target[key]);
  });
  const { data: updatedRow, error: updateError } = await updateBuilder
    .select('period_start, offers_generated')
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to bump usage counter: ${updateError.message}`);
  }

  const period = normalizeDate(updatedRow?.period_start, state.periodStart);
  const offersGenerated = Number(updatedRow?.offers_generated ?? state.offersGenerated + 1);
  return { allowed: true, offersGenerated, periodStart: period };
}

export async function incrementUsage<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string,
): Promise<UsageIncrementResult> {
  const config = COUNTER_CONFIG[kind];
  const normalizedLimit = Number.isFinite(limit ?? NaN) ? Number(limit) : null;

  if (normalizedLimit === null) {
    return fallbackIncrement(supabase, kind, target, null, periodStart);
  }

  const rpcPayload =
    kind === 'user'
      ? {
          p_user_id: target.userId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
        }
      : {
          p_user_id: target.userId,
          p_device_id: (target as CounterTargets['device']).deviceId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
        };

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload as Record<string, unknown>);
  if (error) {
    const message = error.message ?? '';
    const details = (error as { details?: string }).details ?? '';
    const combined = `${message} ${details}`.toLowerCase();
    if (
      combined.includes(config.rpc) ||
      combined.includes('multiple function variants') ||
      combined.includes('could not find function')
    ) {
      return fallbackIncrement(supabase, kind, target, normalizedLimit, periodStart);
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

async function rollbackUsageIncrementForKind<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
): Promise<void> {
  const config = COUNTER_CONFIG[kind];
  const normalizedExpected = normalizeDate(expectedPeriod, expectedPeriod);

  const buildQuery = () => {
    let builder = supabase.from(config.table).select('offers_generated, period_start');
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(([key, column]) => {
      builder = builder.eq(column, target[key]);
    });
    return builder;
  };

  const { data: existing, error } = await buildQuery().maybeSingle();
  if (error) {
    console.warn('Failed to load usage counter for rollback', { kind, target, error });
    return;
  }

  if (!existing) {
    console.warn('Usage rollback skipped: counter not found', { kind, target, expectedPeriod: normalizedExpected });
    return;
  }

  let record = existing;
  let periodStart = normalizeDate((record as { period_start?: unknown }).period_start, normalizedExpected);

  if (periodStart !== normalizedExpected) {
    let normalizedQuery = buildQuery();
    normalizedQuery = normalizedQuery.eq('period_start', normalizedExpected);
    const { data: normalizedRow, error: normalizedError } = await normalizedQuery.maybeSingle();

    if (normalizedError) {
      console.warn('Failed to load normalized usage counter for rollback', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        error: normalizedError,
      });
      return;
    }

    if (!normalizedRow) {
      console.warn('Usage rollback skipped: period mismatch', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        foundPeriod: periodStart,
      });
      return;
    }

    record = normalizedRow;
    periodStart = normalizeDate((record as { period_start?: unknown }).period_start, normalizedExpected);

    if (periodStart !== normalizedExpected) {
      console.warn('Usage rollback skipped: period mismatch', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        foundPeriod: periodStart,
      });
      return;
    }
  }

  const currentCount = Number((record as { offers_generated?: unknown }).offers_generated ?? 0);
  if (!Number.isFinite(currentCount) || currentCount <= 0) {
    console.warn('Usage rollback skipped: non-positive counter', {
      kind,
      target,
      expectedPeriod: normalizedExpected,
      offersGenerated: currentCount,
    });
    return;
  }

  let updateBuilder = supabase
    .from(config.table)
    .update({ offers_generated: currentCount - 1, period_start: normalizedExpected });
  (Object.entries(config.columnMap) as [keyof typeof target, string][]).forEach(([key, column]) => {
    updateBuilder = updateBuilder.eq(column, target[key]);
  });
  updateBuilder = updateBuilder.eq('period_start', (record as { period_start?: unknown }).period_start ?? normalizedExpected);

  const { error: updateError } = await updateBuilder;
  if (updateError) {
    console.warn('Failed to rollback usage counter increment', {
      kind,
      target,
      expectedPeriod: normalizedExpected,
      error: updateError,
    });
  }
}

export async function rollbackUsageIncrement(
  supabase: SupabaseClient,
  userId: string,
  expectedPeriod: string,
  options: RollbackOptions = {},
): Promise<void> {
  if (typeof options.deviceId === 'string' && options.deviceId.length > 0) {
    return rollbackUsageIncrementForKind(supabase, 'device', { userId, deviceId: options.deviceId }, expectedPeriod);
  }

  return rollbackUsageIncrementForKind(supabase, 'user', { userId }, expectedPeriod);
}

export type { CounterKind, CounterTargets };
