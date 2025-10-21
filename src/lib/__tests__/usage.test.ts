import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAndIncrementUsage } from '../services/usage';

describe('checkAndIncrementUsage', () => {
  const rpc = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
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
});
