import { describe, expect, it } from 'vitest';
import { normalizeDate } from './dateUtils';

describe('normalizeDate', () => {
  it('returns ISO date for valid Date instance', () => {
    expect(normalizeDate(new Date('2025-03-10T00:00:00Z'), 'fallback')).toBe('2025-03-10');
  });

  it('parses YYYY-MM-DD strings as UTC midnight', () => {
    expect(normalizeDate('2025-03-10', 'fallback')).toBe('2025-03-10');
  });

  it('handles extreme positive timezone offsets without shifting day', () => {
    expect(normalizeDate('2025-03-10T00:00:00+12:00', 'fallback')).toBe('2025-03-09');
  });

  it('handles extreme negative timezone offsets without shifting day', () => {
    expect(normalizeDate('2025-03-10T00:00:00-12:00', 'fallback')).toBe('2025-03-10');
  });

  it('falls back when value is invalid', () => {
    expect(normalizeDate('not-a-date', 'fallback')).toBe('fallback');
  });
});
