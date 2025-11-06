import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { envClient } from '@/env.client';

let browserClient: SupabaseClient | null = null;
let sessionInitialized = false;
let sessionInitPromise: Promise<void> | null = null;

/**
 * Returns a singleton Supabase client for browser environments.
 * Ensures the instance is only created once per session so hooks can safely
 * depend on it without re-instantiating the client.
 * 
 * The client reads the custom auth cookies (propono_at, propono_rt) and sets
 * the session manually since Supabase JS client doesn't automatically read
 * custom cookie names.
 * 
 * IMPORTANT: The session is initialized asynchronously. Use ensureSession()
 * before making queries to ensure the session is set.
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

    // Initialize session from cookies
    sessionInitPromise = initializeSession(browserClient);
  }

  return browserClient;
}

/**
 * Ensures the Supabase session is initialized from cookies before making queries.
 * This is critical because the client uses custom cookie names (propono_at, propono_rt)
 * instead of Supabase's default cookie names.
 * 
 * This function will re-initialize the session if cookies are present but session is not set.
 */
export async function ensureSession(): Promise<void> {
  const client = getSupabaseClient();
  
  // Check if we already have a valid session
  const { data: { session } } = await client.auth.getSession();
  if (session && session.user) {
    if (!sessionInitialized) {
      sessionInitialized = true;
    }
    return;
  }

  // No session - try to initialize from cookies
  if (!sessionInitPromise) {
    sessionInitPromise = initializeSession(client);
  }

  await sessionInitPromise;
}

/**
 * Reset the session initialization state. Useful after logout or when cookies change.
 */
export function resetSessionState(): void {
  sessionInitialized = false;
  sessionInitPromise = null;
}

/**
 * Initialize session from custom cookies.
 */
async function initializeSession(client: SupabaseClient): Promise<void> {
  if (sessionInitialized || typeof document === 'undefined') {
    return;
  }

  try {
    const accessToken = getCookie('propono_at');
    const refreshToken = getCookie('propono_rt');
    
    if (accessToken && refreshToken) {
      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.warn('Failed to set Supabase session from custom cookies', error);
        // Don't mark as initialized if there was an error
        return;
      }

      if (data.session) {
        sessionInitialized = true;
        console.log('Supabase session initialized from custom cookies', {
          userId: data.session.user?.id,
        });
      }
    } else {
      // No cookies found - check if there's already a session
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        sessionInitialized = true;
      }
    }
  } catch (error) {
    console.warn('Error initializing Supabase session from custom cookies', error);
  }
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
