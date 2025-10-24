import { envServer } from '@/env.server';

type ProviderStatus = {
  enabled: boolean;
  message?: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedStatus: { value: ProviderStatus; expiresAt: number } | null = null;

function buildSettingsEndpoint(): string {
  return new URL('/auth/v1/settings', envServer.NEXT_PUBLIC_SUPABASE_URL).toString();
}

async function fetchProviderStatus(): Promise<ProviderStatus> {
  const endpoint = buildSettingsEndpoint();

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: {
        apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to retrieve Supabase Auth settings.', {
        status: response.status,
        statusText: response.statusText,
      });
      return {
        enabled: false,
        message:
          'Nem sikerült ellenőrizni a Google bejelentkezés állapotát. Kérjük, próbáld újra később.',
      };
    }

    const payload = (await response.json()) as {
      external?: {
        google?: {
          enabled?: boolean;
        };
      };
    };

    const enabled = payload?.external?.google?.enabled === true;

    if (enabled) {
      return { enabled: true };
    }

    return {
      enabled: false,
      message:
        'A Google bejelentkezés jelenleg nincs engedélyezve. Ellenőrizd a Supabase Auth szolgáltató beállításait.',
    };
  } catch (error) {
    console.error('Unexpected error while checking Supabase Auth settings.', error);
    return {
      enabled: false,
      message:
        'Nem sikerült ellenőrizni a Google bejelentkezés állapotát. Kérjük, próbáld újra később.',
    };
  }
}

export async function getGoogleProviderStatus(forceRefresh = false): Promise<ProviderStatus> {
  if (!forceRefresh && cachedStatus && cachedStatus.expiresAt > Date.now()) {
    return cachedStatus.value;
  }

  const status = await fetchProviderStatus();
  cachedStatus = { value: status, expiresAt: Date.now() + CACHE_TTL_MS };
  return status;
}

export function invalidateGoogleProviderStatusCache() {
  cachedStatus = null;
}
