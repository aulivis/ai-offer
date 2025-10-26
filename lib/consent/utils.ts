import type { ConsentRecord } from './types';

export const ensureNecessary = (record: ConsentRecord): ConsentRecord => ({
  ...record,
  granted: {
    ...record.granted,
    necessary: true,
  },
});

export const parseConsentRecord = (raw: unknown, fallbackVersion: string): ConsentRecord | null => {
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
    typeof versionValue === 'string' && versionValue.length > 0 ? versionValue : fallbackVersion;

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
