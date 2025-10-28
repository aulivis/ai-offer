import { envServer } from '@/env.server';

interface ProviderStatus {
  enabled: boolean;
  message?: string;
}

export async function getGoogleProviderStatus(): Promise<ProviderStatus> {
  const baseUrl = envServer.NEXT_PUBLIC_SUPABASE_URL;

  // 1️⃣ Hosted project (service role key)
  if (envServer.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${baseUrl}/auth/v1/settings`, {
        headers: {
          apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const googleSettings = json?.external?.google ?? null;

        // ha van Google objektum, és nincs explicit tiltva, tekintsük engedélyezettnek
        const enabled =
          googleSettings &&
          (googleSettings.enabled === undefined || googleSettings.enabled === true);

        if (enabled) return { enabled: true };

        return {
          enabled: false,
          message:
            'A Google bejelentkezés jelenleg nincs engedélyezve. Ellenőrizd a Supabase Auth szolgáltató beállításait.',
        };
      }
    } catch (err) {
      console.error('Supabase /auth/v1/settings fetch failed:', err);
    }
  }

  // 2️⃣ Fallback: /providers (local CLI)
  try {
    const res = await fetch(`${baseUrl}/auth/v1/providers`, {
      headers: {
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const providers: Array<{ id: string; enabled?: boolean }> = await res.json();
      const google = providers.find((p) => p.id === 'google');
      if (google && google.enabled !== false) return { enabled: true };
      return {
        enabled: false,
        message:
          'A Google bejelentkezés jelenleg nincs engedélyezve. Ellenőrizd a Supabase Auth szolgáltató beállításait.',
      };
    }
  } catch (err) {
    console.error('Supabase /auth/v1/providers fetch failed:', err);
  }

  return { enabled: true };
}
