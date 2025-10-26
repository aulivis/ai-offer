import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
} from '../constants';
import { getConsent, setConsent } from '../storage';

const getMock = vi.fn();
const setMock = vi.fn();
const cookiesMock = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

describe('server consent storage', () => {
  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    cookiesMock.mockReset();
  });

  it('parses a valid consent cookie and enforces necessary flag', async () => {
    const record = {
      granted: { necessary: false, analytics: true, marketing: false },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'custom-version',
    };

    getMock.mockReturnValue({ value: JSON.stringify(record) });
    cookiesMock.mockResolvedValue({ get: getMock });

    const consent = await getConsent();

    expect(cookiesMock).toHaveBeenCalledTimes(1);
    expect(consent).toEqual({
      granted: { necessary: true, analytics: true, marketing: false },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'custom-version',
    });
  });

  it('falls back to the current version and returns null for malformed payloads', async () => {
    getMock.mockReturnValue({ value: JSON.stringify({
      granted: { analytics: true },
      timestamp: '2025-01-01T00:00:00.000Z',
    }) });
    cookiesMock.mockResolvedValue({ get: getMock });

    const consent = await getConsent();
    expect(consent?.version).toBe(CONSENT_VERSION);

    getMock.mockReturnValue({ value: '{invalid-json' });

    const malformed = await getConsent();
    expect(malformed).toBeNull();
  });

  it('sets the consent cookie with sanitized values', async () => {
    cookiesMock.mockResolvedValue({ set: setMock });

    await setConsent({
      granted: { necessary: false, analytics: false, marketing: true },
      timestamp: '2025-02-02T12:00:00.000Z',
      version: 'outdated-version',
    });

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith({
      name: CONSENT_COOKIE_NAME,
      value: JSON.stringify({
        granted: { necessary: true, analytics: false, marketing: true },
        timestamp: '2025-02-02T12:00:00.000Z',
        version: CONSENT_VERSION,
      }),
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: true,
      maxAge: CONSENT_MAX_AGE_SECONDS,
    });
  });
});
