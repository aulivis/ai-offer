import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/env.server';

function isSecure() {
  return envServer.APP_URL.startsWith('https');
}

/**
 * Cookie-backed storage a supabase-js v2 PKCE flow-hoz.
 * Nem fix kulcsnévre támaszkodik: bármilyen key-t 'sb_<key>' néven sütiben tárol.
 */
const storage = {
  async getItem(key: string) {
    const jar = await cookies();
    return jar.get(`sb_${key}`)?.value ?? null;
  },
  async setItem(key: string, value: string) {
    const jar = await cookies();
    jar.set(`sb_${key}`, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure(),
      path: '/',
      maxAge: 5 * 60, // 5 perc elég a redirecthez
    });
  },
  async removeItem(key: string) {
    const jar = await cookies();
    jar.set(`sb_${key}`, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure(),
      path: '/',
      maxAge: 0,
    });
  },
};

export function createSupabaseOAuthClient() {
  const client = createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: false,
        storage,
      },
    },
  );

  return {
    client,
    /**
     * A Supabase különböző kulcsneveket használhat a verifierhez.
     * Itt több ismert variánst próbálunk egymás után,
     * végül fallbackként megkeresünk MINDEN 'sb_*code*verifier*' sütit.
     */
    async consumeCodeVerifier(): Promise<string | null> {
      const authClient = client.auth as { storageKey?: string };
      const configuredStorageKey =
        typeof authClient?.storageKey === 'string' && authClient.storageKey.length > 0
          ? authClient.storageKey
          : null;

      const baseCandidates = [
        configuredStorageKey ? `${configuredStorageKey}-code-verifier` : null,
        'pkce_code_verifier',
        'code_verifier',
        'pkce.code_verifier',
        'oauth_pkce_code_verifier',
        'oauth.pkce.code_verifier',
        'auth.pkce.code_verifier',
      ].filter((value): value is string => Boolean(value));

      const normalizeCandidate = (candidate: string) => {
        if (candidate.startsWith('sb_')) {
          return candidate.slice(3);
        }
        if (candidate.startsWith('sb-')) {
          return candidate.slice(3);
        }
        return candidate;
      };

      const readVerifier = async (candidate: string) => {
        const value = await storage.getItem(candidate);
        if (value) {
          await storage.removeItem(candidate);
          return value;
        }
        return null;
      };

      const seen = new Set<string>();
      const deadline = Date.now() + 1000;

      while (Date.now() <= deadline) {
        const jar = await cookies();
        const cookieEntries = (jar.getAll?.() ?? []) as Array<{ name?: string }>;

        const dynamicCandidates = cookieEntries
          .map((cookie) => cookie?.name)
          .filter((name): name is string => typeof name === 'string')
          .filter((name) => {
            const normalized = name.toLowerCase();
            return normalized.includes('code') && normalized.includes('verifier');
          })
          .map((name) => normalizeCandidate(name));

        for (const candidate of baseCandidates.concat(dynamicCandidates)) {
          if (!seen.has(candidate)) {
            seen.add(candidate);
          }
        }

        for (const candidate of seen) {
          const value = await readVerifier(candidate);
          if (value) {
            return value;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return null;
    },
  };
}
