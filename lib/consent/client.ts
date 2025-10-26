'use client';

import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_SECONDS, CONSENT_VERSION } from './constants';
import { ensureNecessary, parseConsentRecord } from './utils';
import type { ConsentRecord } from './types';

type ConsentCategories = ConsentRecord['granted'];

const serializeConsent = (record: ConsentRecord) => JSON.stringify(record);

const readConsentCookie = (): ConsentRecord | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieString = document.cookie || '';
  const cookies = cookieString.split('; ');
  const consentCookie = cookies.find((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!consentCookie) {
    return null;
  }

  const rawValue = consentCookie.substring(CONSENT_COOKIE_NAME.length + 1);

  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded);
    return parseConsentRecord(parsed, CONSENT_VERSION);
  } catch {
    return null;
  }
};

const buildConsentRecord = (granted: ConsentCategories): ConsentRecord => ({
  granted,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
});

export const getConsent = (): ConsentRecord | null => readConsentCookie();

export const setConsent = async (record: ConsentRecord): Promise<void> => {
  if (typeof document === 'undefined') {
    return;
  }

  const sanitized = ensureNecessary({
    ...record,
    version: CONSENT_VERSION,
  });

  const payload = serializeConsent(sanitized);
  const encoded = encodeURIComponent(payload);

  let cookieValue = `${CONSENT_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieValue += '; Secure';
  }

  document.cookie = cookieValue;
};

export const updateConsent = async (granted: ConsentCategories): Promise<ConsentRecord> => {
  const record = buildConsentRecord(granted);
  await setConsent(record);
  return record;
};
