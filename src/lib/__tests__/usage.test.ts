import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAndIncrementUsage,
  checkAndIncrementDeviceUsage,
  rollbackUsageIncrement,
  getUsageSnapshot,
  currentMonthStart,
} from '../services/usage';

describe('currentMonthStart', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes the billing period start using UTC boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-30T23:59:59.000Z'));

    expect(currentMonthStart().iso).toBe('2024-06-01');

    vi.setSystemTime(new Date('2024-07-01T00:00:01.000Z'));

    expect(currentMonthStart().iso).toBe('2024-07-01');
  });
});

describe('checkAndIncrementUsage', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc, from } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes finite limits directly to the RPC payload', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          allowed: true,
          offers_generated: 3,
          period_start: '2024-07-01',
        },
      ],
      error: null,
    });

    const result = await checkAndIncrementUsage(mockClient, 'user-1', 5);

    expect(rpc).toHaveBeenCalledWith('check_and_increment_usage', {
      p_user_id: 'user-1',
      p_limit: 5,
      p_period_start: '2024-07-01',
    });
    expect(result).toEqual({
      allowed: true,
      offersGenerated: 3,
      periodStart: '2024-07-01',
    });
  });

  it('converts unlimited plans to null for the RPC and normalizes the response', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: false,
        offers_generated: 22,
        period_start: '2024-07-01',
      },
      error: null,
    });

    const result = await checkAndIncrementUsage(mockClient, 'user-2', Number.POSITIVE_INFINITY);

    expect(rpc).toHaveBeenCalledWith('check_and_increment_usage', {
      p_user_id: 'user-2',
      p_limit: null,
      p_period_start: '2024-07-01',
    });
    expect(result).toEqual({
      allowed: false,
      offersGenerated: 22,
      periodStart: '2024-07-01',
    });
  });

  it('throws a descriptive error when the RPC fails', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    await expect(() => checkAndIncrementUsage(mockClient, 'user-3', 10)).rejects.toThrow(
      'Failed to update usage counter: boom',
    );
  });

  it('falls back to manual updates when the RPC is missing', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message:
          'Could not find the function public.check_and_increment_usage(p_limit, p_period_start, p_user_id) in the schema cache',
      },
    });

    const selectBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const insertBuilder = {
      insert: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn(),
    };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.select.mockReturnValue(insertBuilder);
    insertBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 0 },
      error: null,
    });

    const updateBuilder = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn(),
    };
    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.eq.mockReturnValue(updateBuilder);
    updateBuilder.select.mockReturnValue(updateBuilder);
    updateBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 1 },
      error: null,
    });

    from
      .mockReturnValueOnce(selectBuilder as never)
      .mockReturnValueOnce(insertBuilder as never)
      .mockReturnValueOnce(updateBuilder as never);

    const result = await checkAndIncrementUsage(mockClient, 'user-4', 5);

    expect(result).toEqual({ allowed: true, offersGenerated: 1, periodStart: '2024-07-01' });
    expect(from).toHaveBeenCalledTimes(3);
  });

  it('allows overriding the billing period when provided', async () => {
    rpc.mockResolvedValue({
      data: { allowed: true, offers_generated: 4, period_start: '2024-05-01' },
      error: null,
    });

    const result = await checkAndIncrementUsage(mockClient, 'user-override', 2, '2024-05-01');

    expect(rpc).toHaveBeenCalledWith('check_and_increment_usage', {
      p_user_id: 'user-override',
      p_limit: 2,
      p_period_start: '2024-05-01',
    });
    expect(result).toEqual({ allowed: true, offersGenerated: 4, periodStart: '2024-05-01' });
  });
});

describe('checkAndIncrementDeviceUsage', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc, from } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes the device RPC with normalized payload', async () => {
    rpc.mockResolvedValue({
      data: { allowed: true, offers_generated: 2, period_start: '2024-07-01' },
      error: null,
    });

    const result = await checkAndIncrementDeviceUsage(mockClient, 'user-123', 'device-123', 3);

    expect(rpc).toHaveBeenCalledWith('check_and_increment_device_usage', {
      p_user_id: 'user-123',
      p_device_id: 'device-123',
      p_limit: 3,
      p_period_start: '2024-07-01',
    });
    expect(result).toEqual({ allowed: true, offersGenerated: 2, periodStart: '2024-07-01' });
  });

  it('falls back to manual updates when the RPC is missing', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message:
          'Could not find the function public.check_and_increment_device_usage(p_limit, p_period_start, p_device_id) in the schema cache',
      },
    });

    const selectBuilder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const insertBuilder = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.select.mockReturnValue(insertBuilder);
    insertBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 0 },
      error: null,
    });

    const updateBuilder = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.eq.mockReturnValue(updateBuilder);
    updateBuilder.select.mockReturnValue(updateBuilder);
    updateBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 1 },
      error: null,
    });

    from
      .mockReturnValueOnce(selectBuilder as never)
      .mockReturnValueOnce(insertBuilder as never)
      .mockReturnValueOnce(updateBuilder as never);

    const result = await checkAndIncrementDeviceUsage(mockClient, 'user-222', 'device-321', 3);

    expect(result).toEqual({ allowed: true, offersGenerated: 1, periodStart: '2024-07-01' });
    expect(from).toHaveBeenCalledTimes(3);
    expect(selectBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-222');
    expect(selectBuilder.eq).toHaveBeenNthCalledWith(2, 'device_id', 'device-321');
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-222');
    expect(updateBuilder.eq).toHaveBeenNthCalledWith(2, 'device_id', 'device-321');
  });
});

describe('getUsageSnapshot', () => {
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { from } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes missing counters and returns zero usage', async () => {
    const selectBuilder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const insertBuilder = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.select.mockReturnValue(insertBuilder);
    insertBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 0 },
      error: null,
    });

    from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(insertBuilder as never);

    const result = await getUsageSnapshot(mockClient, 'user-new');
    expect(result).toEqual({ periodStart: '2024-07-01', offersGenerated: 0 });
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('resets counters when the stored period is stale', async () => {
    const selectBuilder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-06-01', offers_generated: 5 },
      error: null,
    });

    const updateBuilder = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.eq.mockReturnValue(updateBuilder);
    updateBuilder.select.mockReturnValue(updateBuilder);
    updateBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 0 },
      error: null,
    });

    from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(updateBuilder as never);

    const result = await getUsageSnapshot(mockClient, 'user-old');
    expect(result).toEqual({ periodStart: '2024-07-01', offersGenerated: 0 });
    expect(from).toHaveBeenCalledTimes(2);
  });
});

describe('rollbackUsageIncrement', () => {
  const from = vi.fn();
  const mockClient = { from } as unknown as Parameters<typeof rollbackUsageIncrement>[0];
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    from.mockReset();
    warnSpy.mockClear();
  });

  it('reduces the counter when the period matches and count is positive', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectBuilder: any = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBuilder: any = {
      update: vi.fn(),
      eq: vi.fn(),
      then: vi.fn((onFulfilled: (value: { error: null }) => void) =>
        Promise.resolve({ error: null }).then(onFulfilled),
      ),
      catch: vi.fn((onRejected: (reason: unknown) => void) =>
        Promise.resolve({ error: null }).catch(onRejected),
      ),
    };

    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({
      data: { offers_generated: 2, period_start: '2024-07-01' },
      error: null,
    });

    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.eq.mockReturnValue(updateBuilder);

    from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(updateBuilder as never);

    await rollbackUsageIncrement(mockClient, 'user-1', '2024-07-01');

    expect(updateBuilder.update).toHaveBeenCalledWith({
      offers_generated: 1,
      period_start: '2024-07-01',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('reduces the device counter when the period matches and count is positive', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectBuilder: any = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBuilder: any = {
      update: vi.fn(),
      eq: vi.fn(),
      then: vi.fn((onFulfilled: (value: { error: null }) => void) =>
        Promise.resolve({ error: null }).then(onFulfilled),
      ),
      catch: vi.fn((onRejected: (reason: unknown) => void) =>
        Promise.resolve({ error: null }).catch(onRejected),
      ),
    };

    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({
      data: { offers_generated: 5, period_start: '2024-07-01' },
      error: null,
    });

    updateBuilder.update.mockReturnValue(updateBuilder);
    updateBuilder.eq.mockReturnValue(updateBuilder);

    from
      .mockReturnValueOnce(selectBuilder as never)
      .mockReturnValueOnce(updateBuilder as never);

    await rollbackUsageIncrement(mockClient, 'user-1', '2024-07-01', { deviceId: 'device-1' });

    expect(updateBuilder.update).toHaveBeenCalledWith({
      offers_generated: 4,
      period_start: '2024-07-01',
    });
    expect(selectBuilder.eq).toHaveBeenCalledWith('device_id', 'device-1');
    expect(updateBuilder.eq).toHaveBeenCalledWith('device_id', 'device-1');
  });

  it('skips rollback when the counter is missing', async () => {
    const selectBuilder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    from.mockReturnValueOnce(selectBuilder as never);

    await rollbackUsageIncrement(mockClient, 'user-2', '2024-07-01');

    expect(from).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      'Usage rollback skipped: counter not found',
      expect.objectContaining({
        kind: 'user',
        target: { userId: 'user-2' },
        expectedPeriod: '2024-07-01',
      }),
    );
  });
});
