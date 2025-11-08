/**
 * Unified Quota Service
 * 
 * This is the SINGLE SOURCE OF TRUTH for all quota-related data.
 * All components should use this service instead of querying the database directly.
 * 
 * Design Principles:
 * 1. Single source of truth: Always use get_quota_snapshot RPC function
 * 2. Period handling: Always use currentMonthStart() for period calculation
 * 3. Consistency: All quota displays use the same data source
 * 4. No direct table queries: Never query usage_counters or pdf_jobs directly for display
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { currentMonthStart } from './usage';

export type QuotaData = {
  plan: 'free' | 'standard' | 'pro';
  limit: number | null;
  confirmed: number;
  pendingUser: number;
  pendingDevice: number | null;
  confirmedDevice: number | null;
  remaining: number | null;
  periodStart: string;
};

/**
 * Get quota snapshot for display purposes.
 * This is the ONLY function that should be used to fetch quota data for the UI.
 * 
 * @param sb Supabase client
 * @param deviceId Optional device ID for device-specific quota
 * @param periodStart Optional period start (defaults to current month)
 * @returns Quota data snapshot
 */
export async function getQuotaData(
  sb: SupabaseClient,
  deviceId?: string | null,
  periodStart?: string | null,
): Promise<QuotaData> {
  const { iso: defaultPeriod } = currentMonthStart();
  const normalizedPeriod = periodStart || defaultPeriod;

  const { data, error } = await sb.rpc('get_quota_snapshot', {
    p_period_start: normalizedPeriod,
    p_device_id: deviceId || null,
  });

  if (error) {
    throw new Error(`Failed to load quota: ${error.message}`);
  }

  const snapshot = Array.isArray(data) ? data[0] : data;
  if (!snapshot) {
    throw new Error('No quota snapshot returned from database');
  }

  // Validate plan
  const planValue = snapshot.plan;
  if (planValue !== 'free' && planValue !== 'standard' && planValue !== 'pro') {
    throw new Error(`Invalid plan in quota snapshot: ${planValue}`);
  }

  return {
    plan: planValue as 'free' | 'standard' | 'pro',
    limit: snapshot.quota_limit !== null && snapshot.quota_limit !== undefined 
      ? Number(snapshot.quota_limit) 
      : null,
    confirmed: Number.isFinite(snapshot.confirmed) ? Number(snapshot.confirmed) : 0,
    pendingUser: Number.isFinite(snapshot.pending_user) ? Number(snapshot.pending_user) : 0,
    pendingDevice: snapshot.pending_device !== null && snapshot.pending_device !== undefined
      ? Number(snapshot.pending_device)
      : null,
    confirmedDevice: snapshot.confirmed_device !== null && snapshot.confirmed_device !== undefined
      ? Number(snapshot.confirmed_device)
      : null,
    remaining: snapshot.remaining !== null && snapshot.remaining !== undefined
      ? Number(snapshot.remaining)
      : null,
    periodStart: typeof snapshot.period_start === 'string' 
      ? snapshot.period_start 
      : normalizedPeriod,
  };
}

/**
 * Check if user quota is exhausted
 */
export function isUserQuotaExhausted(quota: QuotaData): boolean {
  if (quota.limit === null) {
    return false; // Unlimited
  }
  return quota.confirmed + quota.pendingUser >= quota.limit;
}

/**
 * Check if device quota is exhausted (only for free plan)
 */
export function isDeviceQuotaExhausted(quota: QuotaData): boolean {
  if (quota.plan !== 'free' || quota.limit === null) {
    return false;
  }
  const deviceLimit = 3; // Free plan device limit
  const deviceConfirmed = quota.confirmedDevice ?? 0;
  const devicePending = quota.pendingDevice ?? 0;
  return deviceConfirmed + devicePending >= deviceLimit;
}

/**
 * Get remaining user quota
 */
export function getRemainingUserQuota(quota: QuotaData): number | null {
  if (quota.limit === null) {
    return null; // Unlimited
  }
  return Math.max(0, quota.limit - quota.confirmed - quota.pendingUser);
}

/**
 * Get remaining device quota (only for free plan)
 */
export function getRemainingDeviceQuota(quota: QuotaData): number | null {
  if (quota.plan !== 'free' || quota.limit === null) {
    return null;
  }
  const deviceLimit = 3; // Free plan device limit
  const deviceConfirmed = quota.confirmedDevice ?? 0;
  const devicePending = quota.pendingDevice ?? 0;
  return Math.max(0, deviceLimit - deviceConfirmed - devicePending);
}






