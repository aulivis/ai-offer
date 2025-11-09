/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, selectMock, orderMock, limitMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  selectMock: vi.fn(),
  orderMock: vi.fn(),
  limitMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServiceRole', () => ({
  supabaseServiceRole: () => ({
    from: fromMock,
  }),
}));

vi.mock('../../../../../../middleware/auth', () => ({
  withAuth: <T>(handler: T) => handler,
}));

describe('GET /api/admin/template-telemetry', () => {
  beforeEach(() => {
    fromMock.mockReset();
    selectMock.mockReset();
    orderMock.mockReset();
    limitMock.mockReset();

    fromMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ order: orderMock });
    orderMock.mockReturnValue({ limit: limitMock });
  });

  it('returns aggregated telemetry with computed summary', async () => {
    limitMock.mockResolvedValueOnce({
      data: [
        {
          template_id: 'free.base@1.1.0',
          total_renders: '12',
          success_count: '9',
          failure_count: '3',
          total_render_ms: '2400',
          render_samples: '12',
          failure_rate: '0.25',
          average_render_ms: '200',
        },
        {
          template_id: 'premium.elegant@1.1.0',
          total_renders: 8,
          success_count: 8,
          failure_count: 0,
          total_render_ms: 1600,
          render_samples: 8,
          failure_rate: 0,
          average_render_ms: 200,
        },
      ],
      error: null,
    });

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/template-telemetry'));

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toMatchObject({
      summary: {
        totalRenders: 20,
        failureRate: 0.15,
        averageRenderMs: 200,
      },
      rows: [
        expect.objectContaining({
          templateId: 'free.base@1.1.0',
          totalRenders: 12,
          successCount: 9,
          failureCount: 3,
          failureRate: 0.25,
          averageRenderMs: 200,
        }),
        expect.objectContaining({
          templateId: 'premium.elegant@1.1.0',
          totalRenders: 8,
          successCount: 8,
          failureCount: 0,
          failureRate: 0,
          averageRenderMs: 200,
        }),
      ],
    });
    expect(payload.generatedAt).toEqual(expect.any(String));

    expect(fromMock).toHaveBeenCalledWith('template_render_metrics');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(orderMock).toHaveBeenCalledWith('total_renders', { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(50);
  });

  it('returns a 500 when the query fails', async () => {
    limitMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/admin/template-telemetry'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Nem sikerült betölteni a telemetria adatokat.',
    });
  });
});
