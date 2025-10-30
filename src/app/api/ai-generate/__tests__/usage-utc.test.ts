/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import {
  checkAndIncrementUsage,
  getUsageWithPending,
  rollbackUsageIncrement,
} from '@/lib/services/usage';

const { countPendingPdfJobsMock, resolveEffectivePlanMock, getMonthlyOfferLimitMock } = vi.hoisted(
  () => {
    const resolveEffectivePlanMock = vi.fn((plan: string | null | undefined): SubscriptionPlan => {
      if (plan === 'pro' || plan === 'standard') {
        return plan;
      }
      return 'free';
    });

    const getMonthlyOfferLimitMock = vi.fn((plan: SubscriptionPlan) => {
      if (plan === 'pro') return null;
      if (plan === 'standard') return 10;
      return 3;
    });

    return {
      countPendingPdfJobsMock: vi.fn<[unknown, unknown], Promise<number>>(),
      resolveEffectivePlanMock,
      getMonthlyOfferLimitMock,
    };
  },
);

vi.mock('@/lib/queue/pdf', () => ({
  countPendingPdfJobs: countPendingPdfJobsMock,
}));

vi.mock('@/lib/subscription', () => ({
  resolveEffectivePlan: resolveEffectivePlanMock,
  getMonthlyOfferLimit: getMonthlyOfferLimitMock,
}));

describe('usage UTC handling for AI generate API', () => {
  beforeEach(() => {
    countPendingPdfJobsMock.mockReset();
    resolveEffectivePlanMock.mockClear();
    getMonthlyOfferLimitMock.mockClear();
  });

  it("normalizes explicit period dates like '2025-10-01' using UTC boundaries", async () => {
    countPendingPdfJobsMock.mockResolvedValueOnce(1);
    const profilesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { plan: 'standard' }, error: null }),
    };
    const usageBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { period_start: '2025-10-01', offers_generated: 2 },
        error: null,
      }),
    };
    const from = vi
      .fn()
      .mockImplementationOnce(() => profilesBuilder as never)
      .mockImplementationOnce(() => usageBuilder as never);

    const result = await getUsageWithPending({ from } as never, {
      userId: 'user-utc',
      periodStart: '2025-10-01',
    });

    expect(result.periodStart).toBe('2025-10-01');
    expect(result.confirmed).toBe(2);
    expect(result.pendingUser).toBe(1);
    expect(result.remaining).toBe(7);
    expect(countPendingPdfJobsMock).toHaveBeenCalledWith(expect.anything(), {
      userId: 'user-utc',
      periodStart: '2025-10-01',
    });
  });

  it('falls back to timestamp metadata when period_start is missing', async () => {
    countPendingPdfJobsMock.mockResolvedValueOnce(2);
    const profilesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { plan: 'standard' }, error: null }),
    };
    const usageBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          period_start: null,
          updated_at: '2025-10-01T06:00:00+02:00',
          offers_generated: 4,
        },
        error: null,
      }),
    };
    const resetBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { period_start: '2025-10-01', offers_generated: 0 },
        error: null,
      }),
    };
    const from = vi
      .fn()
      .mockImplementationOnce(() => profilesBuilder as never)
      .mockImplementationOnce(() => usageBuilder as never)
      .mockImplementationOnce(() => resetBuilder as never);

    const snapshot = await getUsageWithPending({ from } as never, {
      userId: 'user-created-at',
      periodStart: '2025-10-01',
    });

    expect(snapshot.periodStart).toBe('2025-10-01');
    expect(snapshot.confirmed).toBe(4);
    expect(snapshot.pendingUser).toBe(2);
    expect(snapshot.remaining).toBe(4);
    expect(countPendingPdfJobsMock).toHaveBeenCalledWith(expect.anything(), {
      userId: 'user-created-at',
      periodStart: '2025-10-01',
    });
    expect(resetBuilder.update).not.toHaveBeenCalled();
  });

  it('rolls back usage when stored dates cross timezone boundaries', async () => {
    const selectBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          period_start: '2025-09-30T23:00:00-01:00',
          offers_generated: 3,
        },
        error: null,
      }),
    };

    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: (value: { error: null }) => void) =>
        Promise.resolve({ error: null }).then(onFulfilled),
      ),
      catch: vi.fn((onRejected: (reason: unknown) => void) =>
        Promise.resolve({ error: null }).catch(onRejected),
      ),
    };

    const from = vi
      .fn()
      .mockImplementationOnce(() => selectBuilder as never)
      .mockImplementationOnce(() => updateBuilder as never);

    await rollbackUsageIncrement({ from } as never, 'user-timezone', '2025-10-01');

    expect(updateBuilder.update).toHaveBeenCalledWith({
      offers_generated: 2,
      period_start: '2025-10-01',
    });
  });

  it('falls back to manual quota updates when RPC results are ambiguous', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          'More than one function matches the given name and argument types. Function public.check_and_increment_usage(p_limit, p_period_start, p_user_id)',
      },
    });

    const selectBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { period_start: '2025-10-01', offers_generated: 3 },
        error: null,
      }),
    };

    const updateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { period_start: '2025-10-01', offers_generated: 4 },
        error: null,
      }),
    };

    const from = vi
      .fn()
      .mockImplementationOnce(() => selectBuilder as never)
      .mockImplementationOnce(() => updateBuilder as never);

    const result = await checkAndIncrementUsage(
      { rpc, from } as never,
      'user-ambiguous',
      5,
      '2025-10-01',
    );

    expect(result).toEqual({ allowed: true, offersGenerated: 4, periodStart: '2025-10-01' });
    expect(selectBuilder.select).toHaveBeenCalled();
    expect(updateBuilder.update).toHaveBeenCalledWith({
      offers_generated: 4,
      period_start: '2025-10-01',
    });
  });
});
