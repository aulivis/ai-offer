import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkQuotaWithPending, checkDeviceQuotaWithPending } from '../services/usage';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('checkQuotaWithPending', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc, from } as any as SupabaseClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses atomic RPC function when available', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: true,
        confirmed_count: 5,
        pending_count: 2,
        total_count: 7,
      },
      error: null,
    });

    const result = await checkQuotaWithPending(mockClient, 'user-1', 10);

    expect(rpc).toHaveBeenCalledWith('check_quota_with_pending', {
      p_user_id: 'user-1',
      p_limit: 10,
      p_period_start: '2024-07-01',
    });
    expect(result).toEqual({
      allowed: true,
      confirmedCount: 5,
      pendingCount: 2,
      totalCount: 7,
    });
  });

  it('rejects when total count exceeds limit', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: false,
        confirmed_count: 8,
        pending_count: 3,
        total_count: 11,
      },
      error: null,
    });

    const result = await checkQuotaWithPending(mockClient, 'user-1', 10);

    expect(result).toEqual({
      allowed: false,
      confirmedCount: 8,
      pendingCount: 3,
      totalCount: 11,
    });
  });

  it('allows unlimited plans (null limit)', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: true,
        confirmed_count: 100,
        pending_count: 50,
        total_count: 150,
      },
      error: null,
    });

    const result = await checkQuotaWithPending(mockClient, 'user-1', null);

    expect(rpc).toHaveBeenCalledWith('check_quota_with_pending', {
      p_user_id: 'user-1',
      p_limit: null,
      p_period_start: '2024-07-01',
    });
    expect(result.allowed).toBe(true);
  });

  it('falls back to non-atomic check when RPC is missing', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'function check_quota_with_pending does not exist' },
    });

    // Mock getUsageSnapshot
    const selectBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 5 },
      error: null,
    });

    // Mock countPendingPdfJobs
    const countBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      head: vi.fn(),
    };
    countBuilder.select.mockReturnValue(countBuilder);
    countBuilder.eq.mockReturnValue(countBuilder);
    countBuilder.in.mockReturnValue(countBuilder);
    countBuilder.head.mockResolvedValue({
      count: 2,
      error: null,
    });

    from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(countBuilder as never);

    const result = await checkQuotaWithPending(mockClient, 'user-1', 10);

    expect(result).toEqual({
      allowed: true,
      confirmedCount: 5,
      pendingCount: 2,
      totalCount: 7,
    });
  });

  it('handles period override', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: true,
        confirmed_count: 3,
        pending_count: 1,
        total_count: 4,
      },
      error: null,
    });

    const result = await checkQuotaWithPending(mockClient, 'user-1', 10, '2024-06-01');

    expect(rpc).toHaveBeenCalledWith('check_quota_with_pending', {
      p_user_id: 'user-1',
      p_limit: 10,
      p_period_start: '2024-06-01',
    });
    expect(result.totalCount).toBe(4);
  });
});

describe('checkDeviceQuotaWithPending', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc, from } as any as SupabaseClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses atomic RPC function for device quota', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: true,
        confirmed_count: 2,
        pending_count: 1,
        total_count: 3,
      },
      error: null,
    });

    const result = await checkDeviceQuotaWithPending(mockClient, 'user-1', 'device-1', 5);

    expect(rpc).toHaveBeenCalledWith('check_device_quota_with_pending', {
      p_user_id: 'user-1',
      p_device_id: 'device-1',
      p_limit: 5,
      p_period_start: '2024-07-01',
    });
    expect(result).toEqual({
      allowed: true,
      confirmedCount: 2,
      pendingCount: 1,
      totalCount: 3,
    });
  });

  it('rejects when device limit is exceeded', async () => {
    rpc.mockResolvedValue({
      data: {
        allowed: false,
        confirmed_count: 4,
        pending_count: 1,
        total_count: 5,
      },
      error: null,
    });

    const result = await checkDeviceQuotaWithPending(mockClient, 'user-1', 'device-1', 5);

    expect(result.allowed).toBe(false);
    expect(result.totalCount).toBe(5);
  });

  it('falls back to non-atomic check when RPC is missing', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'function check_device_quota_with_pending does not exist' },
    });

    // Mock getDeviceUsageSnapshot
    const selectBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    selectBuilder.select.mockReturnValue(selectBuilder);
    selectBuilder.eq.mockReturnValue(selectBuilder);
    selectBuilder.maybeSingle.mockResolvedValue({
      data: { period_start: '2024-07-01', offers_generated: 2 },
      error: null,
    });

    // Mock countPendingPdfJobs with device filter
    const countBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      head: vi.fn(),
    };
    countBuilder.select.mockReturnValue(countBuilder);
    countBuilder.eq.mockReturnValue(countBuilder);
    countBuilder.in.mockReturnValue(countBuilder);
    countBuilder.head.mockResolvedValue({
      count: 1,
      error: null,
    });

    from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(countBuilder as never);

    const result = await checkDeviceQuotaWithPending(mockClient, 'user-1', 'device-1', 5);

    expect(result).toEqual({
      allowed: true,
      confirmedCount: 2,
      pendingCount: 1,
      totalCount: 3,
    });
  });
});
