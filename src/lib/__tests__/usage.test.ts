import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAndIncrementUsage } from '../services/usage';

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
      'Failed to update usage counter: boom'
    );
  });

  it('falls back to manual updates when the RPC is missing', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: 'Could not find the function public.check_and_increment_usage(p_limit, p_period_start, p_user_id) in the schema cache',
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
});
