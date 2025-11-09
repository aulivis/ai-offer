import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeRateLimit, getClientIdentifier } from '../rateLimiting';
import type { RateLimitClient } from '../rateLimiting';

describe('consumeRateLimit', () => {
  const rpc = vi.fn();
  const from = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockClient = { rpc, from } as any as RateLimitClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-05T12:00:00.000Z'));
    rpc.mockReset();
    from.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('atomic increment', () => {
    it('uses atomic increment function when available', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: { key: 'test-key', count: 5, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      rpc.mockResolvedValue({
        data: { key: 'test-key', count: 6, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      from.mockReturnValue(selectBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(rpc).toHaveBeenCalledWith('increment_rate_limit', {
        p_key: 'test-key',
        p_max_requests: 10,
        p_window_ms: 60000,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(10);
    });

    it('falls back to non-atomic increment when RPC is missing', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: { key: 'test-key', count: 5, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      const updateBuilder = {
        update: vi.fn(),
        eq: vi.fn(),
        select: vi.fn(),
        single: vi.fn(),
      };
      updateBuilder.update.mockReturnValue(updateBuilder);
      updateBuilder.eq.mockReturnValue(updateBuilder);
      updateBuilder.select.mockReturnValue(updateBuilder);
      updateBuilder.single.mockResolvedValue({
        data: { key: 'test-key', count: 6, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      rpc.mockResolvedValue({
        data: null,
        error: { message: 'function increment_rate_limit does not exist' },
      });

      from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(updateBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(updateBuilder.update).toHaveBeenCalledWith({ count: 6 });
    });

    it('rejects requests when limit is exceeded', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: { key: 'test-key', count: 9, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      rpc.mockResolvedValue({
        data: { key: 'test-key', count: 10, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      from.mockReturnValue(selectBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(result.allowed).toBe(true); // Still allowed at limit
      expect(result.remaining).toBe(0);
    });

    it('rejects requests when limit is exceeded (count > max)', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: { key: 'test-key', count: 10, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      rpc.mockResolvedValue({
        data: { key: 'test-key', count: 11, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      from.mockReturnValue(selectBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('window reset', () => {
    it('resets counter when window expires', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: { key: 'test-key', count: 10, expires_at: '2024-07-05T11:59:00.000Z' }, // Expired
        error: null,
      });

      const upsertBuilder = {
        upsert: vi.fn(),
        select: vi.fn(),
        single: vi.fn(),
      };
      upsertBuilder.upsert.mockReturnValue(upsertBuilder);
      upsertBuilder.select.mockReturnValue(upsertBuilder);
      upsertBuilder.single.mockResolvedValue({
        data: { key: 'test-key', count: 1, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(upsertBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(upsertBuilder.upsert).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('creates new entry when none exists', async () => {
      const selectBuilder = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      };
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockReturnValue(selectBuilder);
      selectBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const upsertBuilder = {
        upsert: vi.fn(),
        select: vi.fn(),
        single: vi.fn(),
      };
      upsertBuilder.upsert.mockReturnValue(upsertBuilder);
      upsertBuilder.select.mockReturnValue(upsertBuilder);
      upsertBuilder.single.mockResolvedValue({
        data: { key: 'test-key', count: 1, expires_at: '2024-07-05T12:01:00.000Z' },
        error: null,
      });

      from.mockReturnValueOnce(selectBuilder as never).mockReturnValueOnce(upsertBuilder as never);

      const result = await consumeRateLimit(mockClient, 'test-key', 10, 60000);

      expect(upsertBuilder.upsert).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });
});

describe('getClientIdentifier', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getClientIdentifier(req)).toBe('192.168.1.1');
  });

  it('uses x-real-ip when x-forwarded-for is missing', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '192.168.1.2' },
    });
    expect(getClientIdentifier(req)).toBe('192.168.1.2');
  });

  it('returns unknown when no IP headers are present', () => {
    const req = new Request('https://example.com');
    expect(getClientIdentifier(req)).toBe('unknown');
  });

  it('handles empty x-forwarded-for header', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '' },
    });
    expect(getClientIdentifier(req)).toBe('unknown');
  });
});
