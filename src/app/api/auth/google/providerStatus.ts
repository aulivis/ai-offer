import { envServer } from '@/env.server';

interface ProviderStatus {
  enabled: boolean;
  message?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  status: ProviderStatus;
};

let cache: CacheEntry | null = null;

const PROVIDER_DISABLED_MESSAGE =
  'A Google bejelentkezés jelenleg nincs engedélyezve. Ellenőrizd a Supabase Auth szolgáltató beállításait.';

function buildFailureMessage(): string {
  const contact = envServer.PUBLIC_CONTACT_EMAIL?.trim();
  const contactSuffix = contact ? ` Vedd fel velünk a kapcsolatot: ${contact}.` : '';
  return `Nem sikerült ellenőrizni a Google bejelentkezés állapotát. Próbáld meg később.${contactSuffix}`;
}

export function invalidateGoogleProviderStatusCache(): void {
  cache = null;
}

async function fetchWithServiceRole(baseUrl: string): Promise<ProviderStatus | null> {
  if (!envServer.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/auth/v1/settings`, {
      headers: {
        apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        enabled: false,
        message: buildFailureMessage(),
      };
    }

    const json = await res.json();
    const googleSettings = json?.external?.google ?? null;
    const enabled = Boolean(
      googleSettings && (googleSettings.enabled === undefined || googleSettings.enabled === true),
    );

    if (enabled) {
      return { enabled: true };
    }

    return {
      enabled: false,
      message: PROVIDER_DISABLED_MESSAGE,
    };
  } catch (error) {
    console.error('Supabase /auth/v1/settings fetch failed:', error);
    return {
      enabled: false,
      message: buildFailureMessage(),
    };
  }
}

async function fetchWithAnonKey(baseUrl: string): Promise<ProviderStatus | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/v1/providers`, {
      headers: {
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        enabled: false,
        message: buildFailureMessage(),
      };
    }

    const providers: Array<{ id: string; enabled?: boolean }> = await res.json();
    const google = providers.find((provider) => provider.id === 'google');
    if (google && google.enabled === false) {
      return {
        enabled: false,
        message: PROVIDER_DISABLED_MESSAGE,
      };
    }

    return { enabled: true };
  } catch (error) {
    console.error('Supabase /auth/v1/providers fetch failed:', error);
    return {
      enabled: false,
      message: buildFailureMessage(),
    };
  }
}

async function loadProviderStatus(): Promise<ProviderStatus> {
  const baseUrl = envServer.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleResult = await fetchWithServiceRole(baseUrl);
  if (serviceRoleResult) {
    return serviceRoleResult;
  }

  const anonResult = await fetchWithAnonKey(baseUrl);
  if (anonResult) {
    return anonResult;
  }

  return {
    enabled: false,
    message: buildFailureMessage(),
  };
}

export async function getGoogleProviderStatus(forceRefresh = false): Promise<ProviderStatus> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) {
    return cache.status;
  }

  const status = await loadProviderStatus();
  cache = {
    status,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return status;
}
