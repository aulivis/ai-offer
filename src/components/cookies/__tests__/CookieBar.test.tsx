import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/copy';

import CookieBar from '../CookieBar';
import { CONSENT_VERSION } from '@/lib/consent/constants';
import type { ConsentRecord } from '@/lib/consent/types';

const getConsentMock = vi.fn<[], ConsentRecord | null>();
const updateConsentMock = vi.fn();

vi.mock('@/lib/consent/client', () => ({
  getConsent: () => getConsentMock(),
  updateConsent: (...args: unknown[]) => updateConsentMock(...args),
}));

describe('CookieBar', () => {
  beforeEach(() => {
    getConsentMock.mockReset();
    updateConsentMock.mockReset();
    updateConsentMock.mockResolvedValue({
      granted: { necessary: true, analytics: true, marketing: true },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: CONSENT_VERSION,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the banner when consent is missing', async () => {
    getConsentMock.mockReturnValue(null);

    render(<CookieBar />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'We use cookies to improve your experience. You can accept all cookies, reject the non-essential ones, or customise your preferences.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows the banner again when the consent version changes', async () => {
    const staleConsent: ConsentRecord = {
      granted: { necessary: true, analytics: true, marketing: true },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'older-version',
    };

    getConsentMock.mockReturnValueOnce(staleConsent).mockReturnValueOnce({
      ...staleConsent,
      version: CONSENT_VERSION,
    });

    render(<CookieBar />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeInTheDocument();
    });
  });

  it('keeps the banner hidden when consent is current', async () => {
    getConsentMock.mockReturnValue({
      granted: { necessary: true, analytics: true, marketing: true },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: CONSENT_VERSION,
    });

    render(<CookieBar />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Accept all' })).toBeNull();
    });
  });
});
