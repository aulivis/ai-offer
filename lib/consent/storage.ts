import { cookies } from 'next/headers';

import type { ConsentRecord } from './types';

export const CONSENT_COOKIE_NAME = 'consent';
export const CONSENT_VERSION = process.env.CONSENT_VERSION ?? '2025-10-24';

const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

const ensureNecessary = (record: ConsentRecord): ConsentRecord => ({
  ...record,
  version: CONSENT_VERSION,
  granted: {
    ...record.granted,
    necessary: true,
  },
});

const parseConsentRecord = (raw: unknown): ConsentRecord | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const timestamp = candidate.timestamp;
  const granted = candidate.granted as Record<string, unknown> | undefined;

  if (typeof timestamp !== 'string' || !granted || typeof granted !== 'object') {
    return null;
  }

  const versionValue = candidate.version;
  const version =
    typeof versionValue === 'string' && versionValue.length > 0
      ? versionValue
      : CONSENT_VERSION;

  return {
    granted: {
      necessary: true,
      analytics: granted.analytics === true,
      marketing: granted.marketing === true,
    },
    timestamp,
    version,
  };
};

export async function getConsent(): Promise<ConsentRecord | null> {
  const cookieStore = await cookies();
  const rawConsent = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

  if (!rawConsent) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawConsent);
    return parseConsentRecord(parsed);
  } catch (error) {
    return null;
  }
}

export async function setConsent(record: ConsentRecord): Promise<void> {
  const cookieStore = await cookies();
  const sanitizedRecord = ensureNecessary(record);

  cookieStore.set({
    name: CONSENT_COOKIE_NAME,
    value: JSON.stringify(sanitizedRecord),
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: CONSENT_MAX_AGE_SECONDS,
  });
}
