import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/env.server';
import { createLogger } from '@/lib/logger';
import InitSessionClient from './InitSessionClient';

/**
 * Server component that reads authentication cookies during SSR.
 *
 * This page is used after OAuth/magic link callbacks to ensure the Supabase client
 * session is properly initialized from cookies before redirecting to the
 * final destination (e.g., dashboard).
 *
 * Flow:
 * 1. OAuth callback sets cookies server-side
 * 2. Redirects to this page
 * 3. This server component reads cookies during SSR
 * 4. Validates tokens and passes them to client component
 * 5. Client component initializes Supabase session
 * 6. Verifies the session is ready
 * 7. Redirects to the final destination
 */
export default async function InitSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; user_id?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || '/dashboard';
  const expectedUserId = params.user_id;

  // Read cookies server-side during SSR to verify they're available
  // This ensures cookies from the redirect are accessible before the client component runs
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;
  const refreshToken = cookieStore.get('propono_rt')?.value ?? null;
  const hasCookies = !!(accessToken && refreshToken);

  // If cookies are present, validate them server-side
  if (hasCookies) {
    try {
      // Validate tokens server-side to ensure they're valid before proceeding
      const supabase = createClient(
        envServer.NEXT_PUBLIC_SUPABASE_URL,
        envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          },
        },
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(accessToken!);

      if (userError || !user) {
        // Invalid tokens - redirect to login
        const log = createLogger();
        log.warn('Invalid tokens during SSR', { error: userError?.message });
        redirect(
          `/login?error=${encodeURIComponent('Invalid authentication tokens')}&redirect=${encodeURIComponent(redirectTo)}`,
        );
      }

      // Verify user ID matches if expected
      if (expectedUserId && user.id !== expectedUserId) {
        const log = createLogger();
        log.warn('User ID mismatch during SSR', {
          expected: expectedUserId,
          actual: user.id,
        });
        redirect(
          `/login?error=${encodeURIComponent('User ID mismatch')}&redirect=${encodeURIComponent(redirectTo)}`,
        );
      }

      // Cookies are valid - client component can now fetch tokens via API
      // (We don't pass tokens as props to avoid exposing them in HTML)
      return (
        <InitSessionClient
          hasCookiesAvailable={true}
          redirectTo={redirectTo}
          expectedUserId={expectedUserId}
        />
      );
    } catch (error) {
      // If validation fails, log and let client component handle retry
      const log = createLogger();
      log.warn('Failed to validate tokens during SSR', {
        error:
          error instanceof Error ? { name: error.name, message: error.message } : String(error),
      });
    }
  }

  // If cookies not found, let client component handle it with retry logic
  // This handles edge cases where cookies might need a moment to be available
  return (
    <InitSessionClient
      hasCookiesAvailable={false}
      redirectTo={redirectTo}
      expectedUserId={expectedUserId}
    />
  );
}
