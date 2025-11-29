/**
 * Admin role checking utilities
 *
 * Checks for admin privileges in user metadata (app_metadata or user_metadata).
 * Admin status can be set via:
 * - app_metadata.role = 'admin'
 * - app_metadata.roles = ['admin', ...]
 * - app_metadata.is_admin = true
 * - user_metadata.role = 'admin'
 * - user_metadata.roles = ['admin', ...]
 * - user_metadata.is_admin = true
 */

import type { User } from '@supabase/supabase-js';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

/**
 * Check if a value indicates admin status
 */
function hasAdminFlag(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'admin';
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasAdminFlag(entry));
  }
  return false;
}

/**
 * Check if a user has admin privileges based on their metadata
 * @param user - Supabase user object with metadata
 * @returns true if user has admin privileges
 */
export function isAdmin(user: User): boolean {
  const appMeta = user.app_metadata || {};
  const userMeta = user.user_metadata || {};

  return (
    hasAdminFlag(appMeta.role) ||
    hasAdminFlag(appMeta.roles) ||
    hasAdminFlag(appMeta.is_admin) ||
    hasAdminFlag(userMeta.role) ||
    hasAdminFlag(userMeta.roles) ||
    hasAdminFlag(userMeta.is_admin)
  );
}

/**
 * Check if a user ID has admin privileges by fetching user from Supabase
 * @param userId - User ID to check
 * @returns Promise that resolves to true if user has admin privileges
 */
export async function isAdminById(userId: string): Promise<boolean> {
  try {
    const supabase = supabaseServiceRole();
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data?.user) {
      return false;
    }

    return isAdmin(data.user);
  } catch (_error) {
    // Fail securely - if we can't verify admin status, deny access
    return false;
  }
}

/**
 * Middleware helper to check admin status and return 403 if not admin
 * Use this in API routes that require admin privileges
 */
export async function requireAdmin(userId: string): Promise<{ isAdmin: boolean; user?: User }> {
  try {
    const supabase = supabaseServiceRole();
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data?.user) {
      return { isAdmin: false };
    }

    return { isAdmin: isAdmin(data.user), user: data.user };
  } catch (_error) {
    return { isAdmin: false };
  }
}
