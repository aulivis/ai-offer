import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConsentRecord } from '../types';
import { canRun } from '../gate';

const getConsentMock = vi.hoisted(() => vi.fn<[], ConsentRecord | null>());

vi.mock('../client', () => ({
  getConsent: getConsentMock,
}));

describe('canRun', () => {
  beforeEach(() => {
    getConsentMock.mockReset();
  });

  it('returns false when no consent record is available', () => {
    getConsentMock.mockReturnValue(null);

    expect(canRun('analytics')).toBe(false);
    expect(canRun('marketing')).toBe(false);
  });

  it('returns false when the category is not granted', () => {
    getConsentMock.mockReturnValue({
      granted: { necessary: true, analytics: false, marketing: false },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'v1',
    });

    expect(canRun('analytics')).toBe(false);
    expect(canRun('marketing')).toBe(false);
  });

  it('returns true when the category is granted', () => {
    getConsentMock.mockReturnValue({
      granted: { necessary: true, analytics: true, marketing: true },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'v1',
    });

    expect(canRun('analytics')).toBe(true);
    expect(canRun('marketing')).toBe(true);
  });
});
