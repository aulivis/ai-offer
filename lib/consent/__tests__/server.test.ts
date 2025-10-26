import { describe, expect, it } from 'vitest';

import { CONSENT_COOKIE_NAME } from '../constants';
import { parseConsentFromRequest, allowCategory } from '../server';

type HeadersInit = Record<string, string>;

const buildRequest = (cookieHeader?: string) => {
  const headers: HeadersInit = {};
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }
  return { headers: new Headers(headers) } as Request;
};

describe('parseConsentFromRequest', () => {
  it('parses consent records from the request headers', () => {
    const record = {
      granted: { necessary: true, analytics: true, marketing: false },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'custom-version',
    };
    const encoded = encodeURIComponent(JSON.stringify(record));
    const req = buildRequest(`${CONSENT_COOKIE_NAME}=${encoded}`);

    const parsed = parseConsentFromRequest(req);

    expect(parsed).not.toBeNull();
    expect(parsed?.granted.analytics).toBe(true);
    expect(parsed?.granted.marketing).toBe(false);
    expect(parsed?.granted.necessary).toBe(true);
  });

  it('returns null when the consent cookie is missing or invalid', () => {
    const withoutCookie = buildRequest();
    const malformed = buildRequest(`${CONSENT_COOKIE_NAME}=%7Bnot-json%7D`);

    expect(parseConsentFromRequest(withoutCookie)).toBeNull();
    expect(parseConsentFromRequest(malformed)).toBeNull();
  });
});

describe('allowCategory', () => {
  it('returns false when consent is not granted', () => {
    const record = {
      granted: { necessary: true, analytics: false, marketing: false },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'custom-version',
    };
    const encoded = encodeURIComponent(JSON.stringify(record));
    const req = buildRequest(`${CONSENT_COOKIE_NAME}=${encoded}`);

    expect(allowCategory(req, 'analytics')).toBe(false);
    expect(allowCategory(req, 'marketing')).toBe(false);
  });

  it('returns true when the requested category is granted', () => {
    const record = {
      granted: { necessary: true, analytics: true, marketing: true },
      timestamp: '2025-01-01T00:00:00.000Z',
      version: 'custom-version',
    };
    const encoded = encodeURIComponent(JSON.stringify(record));
    const req = buildRequest(`${CONSENT_COOKIE_NAME}=${encoded}`);

    expect(allowCategory(req, 'analytics')).toBe(true);
    expect(allowCategory(req, 'marketing')).toBe(true);
  });
});
