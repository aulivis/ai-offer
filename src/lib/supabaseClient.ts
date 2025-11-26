import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { envClient } from '@/env.client';
import { createClientLogger } from './clientLogger';

let browserClient: SupabaseClient | null = null;
let sessionInitialized = false;
let sessionInitPromise: Promise<void> | null = null;

// Module-level logger for session-related operations
const getSessionLogger = (userId?: string) =>
  createClientLogger({
    component: 'supabaseClient',
    ...(userId ? { userId } : {}),
  });

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
 * Uses exponential backoff retry logic for post-OAuth scenarios.
 *
 * @param expectedUserId - Optional user ID to validate the session matches. If provided and
 *   the session user ID doesn't match, the session will be re-initialized.
 * @param options - Optional configuration
 * @param options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param options.initialDelay - Initial delay in ms before first retry (default: 100)
 * @param options.maxDelay - Maximum delay in ms between retries (default: 2000)
 */
export async function ensureSession(
  expectedUserId?: string,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  },
): Promise<void> {
  const client = getSupabaseClient();
  const maxRetries = options?.maxRetries ?? 5;
  const initialDelay = options?.initialDelay ?? 100;
  const maxDelay = options?.maxDelay ?? 2000;

  // Check if we already have a valid session
  const {
    data: { session },
  } = await client.auth.getSession();

  // If we have a session and an expected user ID, validate they match
  if (session && session.user && expectedUserId) {
    if (session.user.id !== expectedUserId) {
      getSessionLogger(expectedUserId).warn('Session user ID mismatch, re-initializing session', {
        sessionUserId: session.user.id,
        expectedUserId,
      });
      // Reset session state and re-initialize
      resetSessionState();
      // Clear the current session
      await client.auth.signOut();
      // Re-initialize from cookies with force flag
      sessionInitPromise = initializeSession(client, true);
      await sessionInitPromise;

      // Verify the session now matches after re-initialization with retries
      let verified = false;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, initialDelay * Math.pow(2, attempt)));
        const {
          data: { session: newSession },
        } = await client.auth.getSession();
        if (newSession && newSession.user && newSession.user.id === expectedUserId) {
          verified = true;
          sessionInitialized = true;
          return;
        }
      }

      if (!verified) {
        const {
          data: { session: finalCheck },
        } = await client.auth.getSession();
        getSessionLogger(expectedUserId).error(
          'Session still mismatched after re-initialization',
          undefined,
          {
            sessionUserId: finalCheck?.user?.id,
            expectedUserId,
          },
        );
        // This indicates the cookies themselves have a different user ID
        // than expected - this is a serious auth issue
        throw new Error(
          'Session user ID mismatch: Cookies contain a different user ID than expected.',
        );
      }

      return;
    }
    // Session matches, we're good
    if (!sessionInitialized) {
      sessionInitialized = true;
    }
    return;
  }

  // If we have a session but no expected user ID, we're good
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

  // After initialization, verify we have a session with exponential backoff retry
  // This is critical for post-OAuth scenarios where cookies might not be immediately available
  let finalSession = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms (capped at maxDelay)
    const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const {
      data: { session: checkSession },
    } = await client.auth.getSession();
    if (checkSession && checkSession.user) {
      finalSession = checkSession;
      break;
    }
  }

  // If we still don't have a session, check cookies to see if they exist
  if (!finalSession || !finalSession.user) {
    const accessToken = getCookie('propono_at');
    const refreshToken = getCookie('propono_rt');

    if (!accessToken || !refreshToken) {
      // No cookies - user is not logged in
      throw new Error('No authentication cookies found. Please log in.');
    }

    // Cookies exist but session wasn't set - this indicates a problem
    getSessionLogger(expectedUserId).error(
      'Session initialization failed despite having cookies',
      undefined,
      {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        expectedUserId,
        attempts: maxRetries,
      },
    );
    throw new Error(
      'Failed to initialize session from cookies after multiple attempts. ' +
        'Please try refreshing the page or log in again.',
    );
  }

  // Verify session matches expected user ID if provided
  if (expectedUserId && finalSession.user.id !== expectedUserId) {
    getSessionLogger(expectedUserId).error(
      'Session user ID mismatch after initialization',
      undefined,
      {
        sessionUserId: finalSession.user.id,
        expectedUserId,
      },
    );
    throw new Error('Session user ID mismatch: The session does not match the expected user.');
  }

  // Mark as initialized
  sessionInitialized = true;
  // Only log in development to reduce noise in production
  if (process.env.NODE_ENV !== 'production') {
    getSessionLogger(finalSession.user.id).info('Session ensured successfully', {
      matchesExpected: expectedUserId ? finalSession.user.id === expectedUserId : true,
    });
  }
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
 *
 * @param force - If true, force re-initialization even if already initialized.
 */
async function initializeSession(client: SupabaseClient, force = false): Promise<void> {
  if (!force && sessionInitialized) {
    // Even if already initialized, verify the session is still valid
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session && session.user) {
      return;
    }
    // Session is invalid, reset state and continue
    sessionInitialized = false;
  }

  if (typeof document === 'undefined') {
    return;
  }

  try {
    // Try to read cookies - note: HttpOnly cookies CANNOT be read via document.cookie
    // This is a security feature. If cookies are HttpOnly, this will return null.
    // In that case, we rely on the server-side session verification via API calls.
    const accessToken = getCookie('propono_at');
    const refreshToken = getCookie('propono_rt');

    if (accessToken && refreshToken) {
      // If forcing, sign out first to clear any stale session
      if (force) {
        try {
          await client.auth.signOut();
          // Small delay to ensure signout completes
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (signOutError) {
          // Ignore sign out errors, continue with session setting
          getSessionLogger().warn('Error during sign out before session re-init', {
            error:
              signOutError instanceof Error
                ? { name: signOutError.name, message: signOutError.message }
                : String(signOutError),
          });
        }
      }

      const { data, error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        getSessionLogger().warn('Failed to set Supabase session from custom cookies', {
          error: error.message || String(error),
        });
        // Don't mark as initialized if there was an error
        sessionInitialized = false;
        return;
      }

      if (data.session && data.session.user) {
        // Verify the session was actually set by checking getSession
        // Sometimes setSession returns success but the session isn't immediately available
        // Use exponential backoff for better reliability
        let verifiedSession = null;
        const expectedUserId = data.session.user.id;

        for (let attempt = 0; attempt < 5; attempt++) {
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
          const delay = 50 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));

          const {
            data: { session: checkSession },
            error: checkError,
          } = await client.auth.getSession();

          if (checkError) {
            getSessionLogger().warn(`Session verification attempt ${attempt + 1} failed`, {
              error: checkError.message,
              attempt: attempt + 1,
            });
            continue;
          }

          if (checkSession && checkSession.user && checkSession.user.id === expectedUserId) {
            verifiedSession = checkSession;
            break;
          }
        }

        if (verifiedSession && verifiedSession.user) {
          sessionInitialized = true;
          // Only log in development to reduce noise in production
          if (process.env.NODE_ENV !== 'production') {
            getSessionLogger(verifiedSession.user.id).info(
              'Supabase session initialized from custom cookies',
              {
                forced: force,
                verified: true,
              },
            );
          }
        } else {
          sessionInitialized = false;
          getSessionLogger().warn(
            'Session set but could not verify it was applied after multiple attempts',
            {
              expectedUserId: data.session.user.id,
              attempts: 5,
            },
          );
          // Don't throw here - let ensureSession handle the error with its own retry logic
        }
      } else {
        sessionInitialized = false;
        getSessionLogger().warn('Session set but no user found in response', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
        });
      }
    } else {
      // No cookies found - check if there's already a session
      const {
        data: { session },
      } = await client.auth.getSession();
      if (session && session.user) {
        sessionInitialized = true;
      } else {
        sessionInitialized = false;
      }
    }
  } catch (error) {
    getSessionLogger().warn('Error initializing Supabase session from custom cookies', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    sessionInitialized = false;
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

// Export getCookie for use in ensureSession
export { getCookie };
