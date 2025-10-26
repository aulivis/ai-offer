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
        persistSession: false,
        detectSessionInUrl: false,
        storage,
      },
    }
  );

  return {
    client,
    /**
     * A Supabase különböző kulcsneveket használhat a verifierhez.
     * Itt több ismert variánst próbálunk egymás után,
     * végül fallbackként megkeresünk MINDEN 'sb_*code*verifier*' sütit.
     */
    async consumeCodeVerifier(): Promise<string | null> {
      const candidates = [
        'pkce_code_verifier',
        'code_verifier',
        'pkce.code_verifier',
        'oauth_pkce_code_verifier',
      ];

      for (const key of candidates) {
        const val = await storage.getItem(key);
        if (val) {
          await storage.removeItem(key);
          return val;
        }
      }

      // Fallback: keressünk bármilyen sütit, aminek a neve tartalmazza a 'code' és 'verifier' szavakat
      const jar = await cookies();
      const all = ['pkce', 'code', 'verifier'];
      const possible = (['pkce_code_verifier', 'code_verifier'] as string[]).concat(
        (jar.getAll?.() ?? [])
          .map((c: any) => c?.name as string)
          .filter((n) => typeof n === 'string' && n.startsWith('sb_') && all.every(w => n.toLowerCase().includes(w)))
      );

      for (const cookieName of possible) {
        const name = cookieName.startsWith('sb_') ? cookieName.slice(3) : cookieName;
        const val = await storage.getItem(name);
        if (val) {
          await storage.removeItem(name);
          return val;
        }
      }

      return null;
    },
  };
}
