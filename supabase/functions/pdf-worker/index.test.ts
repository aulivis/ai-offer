import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('https://deno.land/std@0.224.0/http/server.ts', () => ({
  serve: vi.fn(),
}));

vi.mock('https://esm.sh/@supabase/supabase-js@2.44.4', () => ({
  createClient: vi.fn(),
}));

vi.mock('https://deno.land/x/puppeteer@16.2.0/mod.ts', () => ({}));

vi.mock(
  '../../shared/pdfWebhook.ts',
  () => ({
    createPdfWebhookAllowlist: vi.fn(),
    isPdfWebhookUrlAllowed: vi.fn(),
    splitAllowlist: vi.fn(),
  }),
  { virtual: true },
);

vi.mock(
  '../../shared/pdfHtmlSignature.ts',
  () => ({
    assertPdfEngineHtml: vi.fn(),
  }),
  { virtual: true },
);

// Provide a minimal global Deno shim for modules that expect the runtime.
const denoShim = {
  env: { get: vi.fn() as (key: string) => string | undefined },
};
(globalThis as unknown as { Deno?: typeof denoShim }).Deno = denoShim;

let incrementUsage: typeof import('./index.ts').incrementUsage;

describe('incrementUsage', () => {
  beforeAll(async () => {
    ({ incrementUsage } = await import('./index.ts'));
  });

  it('falls back when RPC reports ambiguous signature', async () => {
    const selectMaybeSingle = vi
      .fn()
      .mockResolvedValue({
        data: { period_start: '2024-07-01', offers_generated: 1 },
        error: null,
      });
    const selectBuilder = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: selectMaybeSingle,
    };
    const selectMock = vi.fn().mockReturnValue(selectBuilder);

    const updateMaybeSingle = vi
      .fn()
      .mockResolvedValue({
        data: { period_start: '2024-07-01', offers_generated: 2 },
        error: null,
      });
    const updateSelect = vi.fn().mockReturnValue({ maybeSingle: updateMaybeSingle });
    const updateBuilder = {
      eq: vi.fn().mockReturnThis(),
      select: updateSelect,
    };
    const updateMock = vi.fn().mockReturnValue(updateBuilder);

    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Multiple function variants matched the call.' },
      }),
      from: vi.fn().mockReturnValue({
        select: selectMock,
        update: updateMock,
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ maybeSingle: vi.fn() }),
        }),
      }),
    } as unknown as SupabaseClient;

    const result = await incrementUsage(supabase, 'user', { userId: 'user-1' }, 5, '2024-07-01');

    expect(result).toEqual({ allowed: true, offersGenerated: 2, periodStart: '2024-07-01' });
    expect(supabase.rpc).toHaveBeenCalledWith('check_and_increment_usage', {
      p_limit: 5,
      p_period_start: '2024-07-01',
      p_user_id: 'user-1',
    });
    expect(updateMock).toHaveBeenCalled();
    expect(updateSelect).toHaveBeenCalled();
  });
});
