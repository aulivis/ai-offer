import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { envClient } from '@/env.client';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for browser environments.
 * Ensures the instance is only created once per session so hooks can safely
 * depend on it without re-instantiating the client.
 * 
 * The client reads the custom auth cookies (propono_at, propono_rt) and sets
 * the session manually since Supabase JS client doesn't automatically read
 * custom cookie names.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    const url = envClient.NEXT_PUBLIC_SUPABASE_URL;
    const key = envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });

    // Manually set session from custom cookies if available
    // This is needed because we use custom cookie names (propono_at, propono_rt)
    // instead of Supabase's default cookie names
    if (typeof document !== 'undefined') {
      const accessToken = getCookie('propono_at');
      const refreshToken = getCookie('propono_rt');
      
      if (accessToken && refreshToken) {
        // Set session asynchronously to avoid blocking client creation
        browserClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).catch((error) => {
          console.warn('Failed to set Supabase session from custom cookies', error);
        });
      }
    }
  }

  return browserClient;
}

/**
 * Helper to read a cookie value by name.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() ?? null;
  }
  return null;
}
