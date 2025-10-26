import { CONSENT_COOKIE_NAME, CONSENT_VERSION } from './constants';
import type { ConsentRecord } from './types';
import { parseConsentRecord } from './utils';

type RequestLike = Pick<Request, 'headers'>;

type ConsentCategory = 'analytics' | 'marketing';

const tryParseConsent = (value: string): ConsentRecord | null => {
  try {
    const parsed = JSON.parse(value);
    return parseConsentRecord(parsed, CONSENT_VERSION);
  } catch {
    return null;
  }
};

const safeDecode = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

export const parseConsentFromRequest = (req: RequestLike): ConsentRecord | null => {
  const headerValue = req.headers.get('cookie');
  if (!headerValue) {
    return null;
  }

  const cookies = headerValue.split(';');
  for (const rawCookie of cookies) {
    const trimmed = rawCookie.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    if (name !== CONSENT_COOKIE_NAME) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1);
    if (!rawValue) {
      return null;
    }

    const decoded = safeDecode(rawValue);
    const candidates: string[] = [];

    if (decoded) {
      candidates.push(decoded);
    }
    if (!decoded || decoded !== rawValue) {
      candidates.push(rawValue);
    }

    for (const candidate of candidates) {
      const consent = tryParseConsent(candidate);
      if (consent) {
        return consent;
      }
    }

    return null;
  }

  return null;
};

export const allowCategory = (req: RequestLike, category: ConsentCategory): boolean => {
  const consent = parseConsentFromRequest(req);
  if (!consent) {
    return false;
  }

  return consent.granted[category] === true;
};
