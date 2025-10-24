import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupportedStorage } from '@supabase/auth-js';

import { envServer } from '@/env.server';

const SUPABASE_AUTH_STORAGE_KEY = 'supabase.auth.token';

export type SupabaseOAuthClient = {
  client: SupabaseClient;
  consumeCodeVerifier: () => string | null;
};

function createPkceStorage(storageKey: string): {
  storage: SupportedStorage;
  consumeCodeVerifier: () => string | null;
} {
  const store = new Map<string, string>();
  const codeVerifierKey = `${storageKey}-code-verifier`;
  let codeVerifier: string | null = null;

  const storage: SupportedStorage = {
    isServer: true,
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);

      if (key === codeVerifierKey) {
        const [verifier] = value.split('/');
        codeVerifier = verifier ?? null;
      }
    },
    async removeItem(key) {
      store.delete(key);

      if (key === codeVerifierKey) {
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
  const pkce = createPkceStorage(SUPABASE_AUTH_STORAGE_KEY);

  const client = createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        flowType: 'pkce',
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
        storage: pkce.storage,
      },
      global: {
        headers: {
          apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      },
    },
  );

  return {
    client,
    consumeCodeVerifier: pkce.consumeCodeVerifier,
  };
}
