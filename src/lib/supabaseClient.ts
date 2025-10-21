import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { envClient } from '@/env.client';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for browser environments.
 * Ensures the instance is only created once per session so hooks can safely
 * depend on it without re-instantiating the client.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    const url = envClient.NEXT_PUBLIC_SUPABASE_URL;
    const key = envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    browserClient = createClient(url, key);
  }

  return browserClient;
}
