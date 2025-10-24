import { type SubscriptionPlan } from '@/app/lib/offerTemplates';

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

export function resolveEffectivePlan(rawPlan: string | null | undefined): SubscriptionPlan {
  return normalizePlan(rawPlan);
}
