import { createClient } from '@supabase/supabase-js';
import type { SupportedStorage } from '@supabase/auth-js';

import { envServer } from '@/env.server';

export type SupabaseOAuthClient = {
  client: ReturnType<typeof createClient>;
  consumeCodeVerifier: () => string | null;
};

function createPkceStorage(): {
  storage: SupportedStorage;
  consumeCodeVerifier: () => string | null;
} {
  const store = new Map<string, string>();
  let codeVerifier: string | null = null;

  const storage: SupportedStorage = {
    isServer: true,
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);

      if (key.endsWith('-code-verifier')) {
        const [verifier] = value.split('/');
        codeVerifier = verifier ?? null;
      }
    },
    async removeItem(key) {
      store.delete(key);

      if (key.endsWith('-code-verifier')) {
        codeVerifier = null;
      }
    },
  };

  return {
    storage,
    consumeCodeVerifier() {
      const verifier = codeVerifier;
      codeVerifier = null;
      return verifier;
    },
  };
}

export function createSupabaseOAuthClient(): SupabaseOAuthClient {
  const pkce = createPkceStorage();

  const client = createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        flowType: 'pkce',
        storage: pkce.storage,
      },
      global: {
        headers: {
          apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    },
  );

  return {
    client,
    consumeCodeVerifier: pkce.consumeCodeVerifier,
  };
}
