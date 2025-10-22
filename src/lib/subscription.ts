import { type SubscriptionPlan } from '@/app/lib/offerTemplates';

const UNLIMITED_ACCESS_EMAILS = new Set(['tiens.robert@hotmail.com']);

export function normalizePlan(rawPlan: string | null | undefined): SubscriptionPlan {
  const plan = typeof rawPlan === 'string' ? rawPlan.toLowerCase() : 'free';
  if (plan === 'pro') {
    return 'pro';
  }
  if (plan === 'standard' || plan === 'starter') {
    return 'standard';
  }
  return 'free';
}

export function hasUnlimitedAccess(email: string | null | undefined): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  return UNLIMITED_ACCESS_EMAILS.has(normalized);
}

export function resolveEffectivePlan(
  rawPlan: string | null | undefined,
  email: string | null | undefined
): SubscriptionPlan {
  const normalizedPlan = normalizePlan(rawPlan);
  if (hasUnlimitedAccess(email)) {
    return 'pro';
  }
  return normalizedPlan;
}
