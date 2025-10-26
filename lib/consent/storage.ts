import { cookies } from 'next/headers';

import { CONSENT_COOKIE_NAME, CONSENT_MAX_AGE_SECONDS, CONSENT_VERSION } from './constants';
import { ensureNecessary, parseConsentRecord } from './utils';
import type { ConsentRecord } from './types';

export async function getConsent(): Promise<ConsentRecord | null> {
  const cookieStore = await cookies();
  const rawConsent = cookieStore.get(CONSENT_COOKIE_NAME)?.value;

  if (!rawConsent) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawConsent);
    return parseConsentRecord(parsed, CONSENT_VERSION);
  } catch {
    return null;
  }
}

export async function setConsent(record: ConsentRecord): Promise<void> {
  const cookieStore = await cookies();
  const sanitizedRecord = ensureNecessary({
    ...record,
    version: CONSENT_VERSION,
  });

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
