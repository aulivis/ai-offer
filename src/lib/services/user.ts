import type { SupabaseClient } from '@supabase/supabase-js';

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
