export const CONSENT_COOKIE_NAME = 'consent';
export const CONSENT_VERSION =
  process.env.NEXT_PUBLIC_CONSENT_VERSION ?? process.env.CONSENT_VERSION ?? '2025-10-24';
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days
