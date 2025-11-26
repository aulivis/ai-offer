import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      builder = builder.eq(column, target[key]);
    },
  );
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
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        insertPayload[column] = target[key];
      },
    );
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
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        updateBuilder = updateBuilder.eq(column, target[key]);
      },
    );
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
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    },
  );
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
  excludeJobId?: string | null,
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
          p_exclude_job_id: excludeJobId || null,
        }
      : {
          p_user_id: target.userId,
          p_device_id: (target as CounterTargets['device']).deviceId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
          p_exclude_job_id: excludeJobId || null,
        };

  // Debug logging for quota increment (only in development)
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Calling quota increment RPC', {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      periodStart,
      excludeJobId,
    });
  }

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload as Record<string, unknown>);
  if (error) {
    const message = error.message ?? '';
    const details = (error as { details?: string }).details ?? '';
    const combined = `${message} ${details}`.toLowerCase();

    logger.error('Quota increment RPC error', error, {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      periodStart,
    });

    if (
      combined.includes(config.rpc) ||
      combined.includes('multiple function variants') ||
      combined.includes('could not find function')
    ) {
      logger.warn('Falling back to non-RPC increment due to RPC function error', {
        rpc: config.rpc,
        kind,
        target,
      });
      return fallbackIncrement(supabase, kind, target, normalizedLimit, periodStart);
    }
    throw new Error(`Failed to update usage counter: ${message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  const incrementResult = {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };

  // Debug logging for quota increment result (only in development)
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Quota increment RPC result', {
      rpc: config.rpc,
      kind,
      target,
      result: incrementResult,
    });
  }

  if (!incrementResult.allowed) {
    logger.warn('Quota increment not allowed', {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      currentUsage: incrementResult.offersGenerated,
      periodStart: incrementResult.periodStart,
    });
  }

  return incrementResult;
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
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        builder = builder.eq(column, target[key]);
      },
    );
    return builder;
  };

  const { data: existing, error } = await buildQuery().maybeSingle();
  if (error) {
    logger.warn('Failed to load usage counter for rollback', { error, kind, target });
    return;
  }

  if (!existing) {
    logger.warn('Usage rollback skipped: counter not found', {
      kind,
      target,
      expectedPeriod: normalizedExpected,
    });
    return;
  }

  let record = existing;
  let periodStart = normalizeDate(
    (record as { period_start?: unknown }).period_start,
    normalizedExpected,
  );

  if (periodStart !== normalizedExpected) {
    let normalizedQuery = buildQuery();
    normalizedQuery = normalizedQuery.eq('period_start', normalizedExpected);
    const { data: normalizedRow, error: normalizedError } = await normalizedQuery.maybeSingle();

    if (normalizedError) {
      logger.warn('Failed to load normalized usage counter for rollback', {
        error: normalizedError,
        kind,
        target,
        expectedPeriod: normalizedExpected,
      });
      return;
    }

    if (!normalizedRow) {
      logger.warn('Usage rollback skipped: period mismatch', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        foundPeriod: periodStart,
      });
      return;
    }

    record = normalizedRow;
    periodStart = normalizeDate(
      (record as { period_start?: unknown }).period_start,
      normalizedExpected,
    );

    if (periodStart !== normalizedExpected) {
      logger.warn('Usage rollback skipped: period mismatch', {
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
    logger.warn('Usage rollback skipped: non-positive counter', {
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
  updateBuilder = updateBuilder.eq(
    'period_start',
    (record as { period_start?: unknown }).period_start ?? normalizedExpected,
  );

  const { error: updateError } = await updateBuilder;
  if (updateError) {
    logger.warn('Failed to rollback usage counter increment', {
      error: updateError,
      kind,
      target,
      expectedPeriod: normalizedExpected,
    });
    throw updateError; // Re-throw to allow retry logic
  }
}

/**
 * Retry rollback operation with exponential backoff
 */
async function rollbackUsageIncrementWithRetry<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
  maxRetries: number = 3,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rollbackUsageIncrementForKind(supabase, kind, target, expectedPeriod);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delayMs = 100 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  // All retries failed - log but don't throw to prevent cascading failures
  logger.error(`Failed to rollback usage increment after ${maxRetries} attempts`, lastError, {
    kind,
    target,
    expectedPeriod,
    maxRetries,
  });
}

export async function rollbackUsageIncrement(
  supabase: SupabaseClient,
  userId: string,
  expectedPeriod: string,
  options: RollbackOptions = {},
): Promise<void> {
  if (typeof options.deviceId === 'string' && options.deviceId.length > 0) {
    return rollbackUsageIncrementWithRetry(
      supabase,
      'device',
      { userId, deviceId: options.deviceId },
      expectedPeriod,
    );
  }

  return rollbackUsageIncrementWithRetry(supabase, 'user', { userId }, expectedPeriod);
}

export type { CounterKind, CounterTargets };
