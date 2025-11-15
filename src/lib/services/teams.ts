import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserProfile } from './user';

/**
 * Verify if a user has a Pro plan
 */
export async function verifyProUser(sb: SupabaseClient, userId: string): Promise<boolean> {
  const profile = await getUserProfile(sb, userId);
  return profile?.plan === 'pro';
}

/**
 * Get all teams a user belongs to
 */
export async function getUserTeams(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb.from('team_members').select('team_id').eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data?.map((m) => m.team_id) || [];
}

/**
 * Get team members for a specific team
 */
export async function getTeamMembers(sb: SupabaseClient, teamId: string) {
  const { data, error } = await sb
    .from('team_members')
    .select(
      `
      id,
      user_id,
      joined_at,
      user:user_id(id, email)
    `,
    )
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Check if user is a member of a team
 */
export async function isTeamMember(
  sb: SupabaseClient,
  userId: string,
  teamId: string,
): Promise<boolean> {
  const { data, error } = await sb
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}
