import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch the authenticated user based on an access token.  This helper
 * wraps the Supabase `auth.getUser` call and provides a clear error
 * message when authentication fails.  It returns the user object or
 * throws with an appropriate message.
 *
 * @param sb Supabase client instance
 * @param accessToken Access token provided in Authorization header
 * @returns Supabase user object
 */
export async function getCurrentUser(sb: SupabaseClient, accessToken: string) {
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw new Error('Érvénytelen token vagy felhasználó. Jelentkezz be újra.');
  }
  return data.user;
}

/**
 * Retrieve the profile row for a given user.  Profiles contain plan
 * information and company details.  If no profile exists the caller
 * receives `null`.
 *
 * @param sb Supabase client instance
 * @param userId User UUID
 * @returns Profile row or null
 */
export async function getUserProfile(sb: SupabaseClient, userId: string) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ?? null;
}