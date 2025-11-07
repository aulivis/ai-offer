'use client';

import { t, type CopyKey } from '@/copy';
import Link from 'next/link';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { envClient } from '@/env.client';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { resolveEffectivePlan } from '@/lib/subscription';
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ToastProvider';

type CardBrand = {
  name: string;
  render: () => JSX.Element;
};

const CARD_BRANDS: CardBrand[] = [
  {
    name: 'Visa',
    render: () => <span className="text-lg font-black tracking-[0.35em] text-[#1a1f71]">VISA</span>,
  },
  {
    name: 'Mastercard',
    render: () => (
      <div className="flex items-center">
        <span aria-hidden className="mr-[-0.55rem] h-7 w-7 rounded-full bg-[#eb001b] opacity-90" />
        <span aria-hidden className="h-7 w-7 rounded-full bg-[#f79e1b] opacity-90" />
      </div>
    ),
  },
  {
    name: 'American Express',
    render: () => (
      <span className="rounded-sm bg-[#2e77bc] px-2 py-0.5 text-[0.8rem] font-bold tracking-[0.2em] text-white">
        AMEX
      </span>
    ),
  },
  {
    name: 'Discover',
    render: () => (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold tracking-[0.2em] text-slate-700">DISCOVER</span>
        <span
          aria-hidden
          className="h-5 w-5 rounded-full bg-gradient-to-br from-[#f15a29] to-[#fbb040]"
        />
      </div>
    ),
  },
  {
    name: 'Diners Club',
    render: () => (
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-slate-50">
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#0a3a66]" />
        </span>
        <span className="text-xs font-semibold tracking-[0.2em] text-slate-700">DINERS</span>
      </div>
    ),
  },
  {
    name: 'JCB',
    render: () => (
      <div className="flex h-6 w-12 overflow-hidden rounded-sm">
        <span aria-hidden className="flex-1 bg-[#0b4ea2]" />
        <span aria-hidden className="flex-1 bg-[#0e9f49]" />
        <span aria-hidden className="flex-1 bg-[#d71920]" />
      </div>
    ),
  },
  {
    name: 'UnionPay',
    render: () => (
      <span className="rounded-sm bg-gradient-to-br from-[#017b94] via-[#026aa7] to-[#df2935] px-2 py-0.5 text-[0.7rem] font-semibold text-white">
        UnionPay
      </span>
    ),
  },
];

const STANDARD_PRICE = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const PRO_PRICE = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const CHECKOUT_API_PATH = '/api/stripe/checkout';

const MARKETING_FEATURE_KEYS: Array<{ title: CopyKey; description: CopyKey }> = [
  {
    title: 'billing.public.marketingFeatures.0.title',
    description: 'billing.public.marketingFeatures.0.description',
  },
  {
    title: 'billing.public.marketingFeatures.1.title',
    description: 'billing.public.marketingFeatures.1.description',
  },
  {
    title: 'billing.public.marketingFeatures.2.title',
    description: 'billing.public.marketingFeatures.2.description',
  },
];

const MARKETING_STEP_KEYS: Array<{ title: CopyKey; description: CopyKey }> = [
  {
    title: 'billing.public.marketingSteps.0.title',
    description: 'billing.public.marketingSteps.0.description',
  },
  {
    title: 'billing.public.marketingSteps.1.title',
    description: 'billing.public.marketingSteps.1.description',
  },
  {
    title: 'billing.public.marketingSteps.2.title',
    description: 'billing.public.marketingSteps.2.description',
  },
];

const MARKETING_SPOTLIGHT_KEYS: CopyKey[] = [
  'billing.public.spotlight.0',
  'billing.public.spotlight.1',
  'billing.public.spotlight.2',
];

const PLAN_ORDER: Record<'free' | 'standard' | 'pro', number> = {
  free: 0,
  standard: 1,
  pro: 2,
};

type PaidPlan = 'standard' | 'pro';

function parsePeriodStart(value: string | null | undefined): Date {
  if (typeof value !== 'string') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value.trim());
  if (match) {
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

// Plan Card Component
function PlanCard({
  planType,
  isCurrent,
  isPopular,
  isDowngrade,
  cta,
  plan,
  isLoading,
}: {
  planType: 'standard' | 'pro';
  isCurrent: boolean;
  isPopular: boolean;
  isDowngrade: boolean;
  cta: ReturnType<typeof getPlanCta>;
  plan: 'free' | 'standard' | 'pro' | null;
  isLoading: boolean;
}) {
  const planData = {
    standard: {
      badge: t('billing.plans.standard.badge'),
      name: t('billing.plans.standard.name'),
      description: t('billing.plans.standard.description'),
      price: '1 490',
      features: [
        t('billing.plans.standard.features.0'),
        t('billing.plans.standard.features.1'),
        t('billing.plans.standard.features.2'),
      ],
    },
    pro: {
      badge: t('billing.plans.pro.name'),
      name: t('billing.plans.pro.name'),
      description: t('billing.plans.pro.description'),
      price: '6 990',
      features: [
        t('billing.plans.pro.features.0'),
        t('billing.plans.pro.features.1'),
        t('billing.plans.pro.features.2'),
      ],
    },
  };

  const data = planData[planType];

  return (
    <Card
      as="article"
      className={[
        'relative flex h-full flex-col transition-all duration-300',
        isCurrent
          ? 'border-primary/60 bg-gradient-to-br from-primary/5 via-white to-white shadow-xl ring-2 ring-primary/20'
          : 'border-border/70 bg-white shadow-lg hover:shadow-xl hover:-translate-y-1',
        isPopular && !isCurrent ? 'border-primary/40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-current={isCurrent ? 'true' : undefined}
    >
      {/* Popular Badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('billing.plans.popularBadge')}
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {t('billing.plans.currentBadge')}
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Plan Badge */}
        {!isCurrent && (
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {planType === 'standard' ? t('billing.plans.standard.badge') : ''}
          </div>
        )}

        {/* Plan Name */}
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{data.name}</h3>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{data.description}</p>

        {/* Downgrade Warning */}
        {isDowngrade && !isCurrent && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-800">
              {t(`billing.plans.${planType}.downgradeHelper`)}
            </p>
          </div>
        )}

        {/* Price */}
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-slate-900">{data.price}</span>
          <span className="text-sm font-medium text-slate-500">
            {t('billing.plans.priceMonthly')}
          </span>
        </div>

        {/* Features List */}
        <ul className="mt-6 flex-1 space-y-3">
          {data.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          onClick={cta.onClick}
          disabled={cta.disabled}
          variant={cta.variant}
          size="lg"
          className="mt-8 w-full"
          loading={isLoading}
        >
          {cta.label}
        </Button>
      </div>
    </Card>
  );
}

// Usage Stat Card Component
function UsageStatCard({
  title,
  value,
  helper,
  progress,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  progress?: { percentage: number; isWarning: boolean; isDanger: boolean };
  icon?: JSX.Element;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white to-slate-50/50 p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {icon && (
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</dt>
      <dd className="mt-2 text-2xl font-bold text-slate-900">{value}</dd>
      {progress && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-600">Használat</span>
            <span className="font-semibold text-slate-700">{progress.percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                progress.isDanger
                  ? 'bg-danger'
                  : progress.isWarning
                    ? 'bg-warning'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              aria-label={`${progress.percentage}% használva`}
            />
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export default function BillingPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useOptionalAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'standard' | 'pro' | null>(null);
  const [usage, setUsage] = useState<{
    offersGenerated: number;
    periodStart: string | null;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    setStatus(searchParams?.get('status') || null);
  }, [searchParams]);

  useEffect(() => {
    setEmail(user?.email ?? null);
  }, [user]);

  const isAuthenticated = authStatus === 'authenticated' && !!user;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPlan(null);
      setUsage(null);
      setLoading(null);
      setIsLoadingData(false);
      return;
    }

    let active = true;
    setIsLoadingData(true);

    (async () => {
      try {
        const { currentMonthStart } = await import('@/lib/services/usage');
        const { iso: currentPeriod } = currentMonthStart();
        const [{ data: profile }, { data: usageRow }] = await Promise.all([
          supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
          supabase
            .from('usage_counters')
            .select('offers_generated, period_start')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (!active) {
          return;
        }

        const effectivePlan = resolveEffectivePlan(profile?.plan ?? null);
        
        // Recalculate usage based on actual successful PDFs to ensure accuracy
        // This fixes cases where quota was incremented but PDF generation failed
        let actualCount = Number(usageRow?.offers_generated ?? 0);
        try {
          const { countSuccessfulPdfs } = await import('@/lib/services/usage');
          actualCount = await countSuccessfulPdfs(supabase, user.id, currentPeriod);
          
          // If count differs, sync it (but don't block UI if sync fails)
          if (actualCount !== Number(usageRow?.offers_generated ?? 0)) {
            const { recalculateUsageFromPdfs } = await import('@/lib/services/usage');
            await recalculateUsageFromPdfs(supabase, user.id, currentPeriod).catch((err) => {
              console.warn('Failed to sync usage counter:', err);
            });
          }
        } catch (recalcError) {
          console.warn('Failed to recalculate usage from PDFs, using counter value:', recalcError);
        }
        
        setPlan(effectivePlan);
        setUsage({
          offersGenerated: actualCount,
          periodStart: usageRow?.period_start ?? currentPeriod,
        });
        setIsLoadingData(false);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load billing information.', error);
        setIsLoadingData(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, supabase, user]);

  async function startCheckout(priceId: string) {
    try {
      setLoading(priceId);
      const resp = await fetchWithSupabaseAuth(CHECKOUT_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
        authErrorMessage: t('billing.checkout.authRequired'),
        defaultErrorMessage: t('billing.checkout.error'),
      });
      const { url } = (await resp.json()) as { url?: string | null };
      if (url) router.push(url);
      else setLoading(null);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof ApiError && typeof e.message === 'string' && e.message.trim()
          ? e.message
          : t('billing.checkout.unexpected');
      showToast({
        title: t('billing.checkout.error'),
        description: message,
        variant: 'error',
      });
      setLoading(null);
    }
  }

  const planLimit = useMemo<number | null>(() => {
    if (plan === 'pro') return null;
    if (plan === 'standard') return 5;
    return 2;
  }, [plan]);

  type PlanCtaVariant = Extract<ButtonProps['variant'], 'primary' | 'secondary'>;

  const getPlanCta = (target: PaidPlan) => {
    const priceId = target === 'standard' ? STANDARD_PRICE : PRO_PRICE;
    const isCurrentPlan = plan === target;
    const isDowngrade = typeof plan === 'string' ? PLAN_ORDER[plan] > PLAN_ORDER[target] : false;
    const isLoading = loading === priceId;

    let label: string;
    if (isLoading) {
      label = t('billing.plans.loadingRedirect');
    } else if (isCurrentPlan) {
      label = t('billing.plans.currentCta');
    } else if (isDowngrade) {
      label = t(`billing.plans.${target}.downgradeCta`);
    } else {
      label = t(`billing.plans.${target}.cta`);
    }

    const variant: PlanCtaVariant = isDowngrade || isCurrentPlan ? 'secondary' : 'primary';

    return {
      label,
      disabled: isCurrentPlan || isLoading,
      variant,
      onClick: isCurrentPlan || isLoading ? undefined : () => startCheckout(priceId),
    };
  };

  const standardCta = getPlanCta('standard');
  const proCta = getPlanCta('pro');

  const isCurrentStandard = plan === 'standard';
  const isCurrentPro = plan === 'pro';
  const isDowngradeToStandard =
    typeof plan === 'string' ? PLAN_ORDER[plan] > PLAN_ORDER.standard : false;

  const offersThisMonth = usage?.offersGenerated ?? 0;
  const planLimitLabel =
    planLimit === null
      ? t('billing.currentPlan.limit.unlimited')
      : t('billing.currentPlan.limit.limited', {
          count: planLimit.toLocaleString('hu-HU'),
        });
  const offersThisMonthLabel = t('billing.currentPlan.offersThisMonth.value', {
    count: offersThisMonth.toLocaleString('hu-HU'),
  });
  const remainingQuotaLabel =
    planLimit === null
      ? t('billing.currentPlan.remaining.unlimited')
      : t('billing.currentPlan.remaining.limited', {
          count: Math.max(planLimit - offersThisMonth, 0).toLocaleString('hu-HU'),
        });
  const planLabelKeys: Record<'free' | 'standard' | 'pro', CopyKey> = {
    free: 'billing.currentPlan.planLabels.free',
    standard: 'billing.currentPlan.planLabels.standard',
    pro: 'billing.currentPlan.planLabels.pro',
  };
  const hasUnlimitedEmail = planLimit === null;

  const periodStartDate = useMemo(() => parsePeriodStart(usage?.periodStart), [usage?.periodStart]);
  const resetDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = new Date(periodStartDate);
    next.setHours(0, 0, 0, 0);
    next.setMonth(next.getMonth() + 1, 1);

    while (next <= today) {
      next.setMonth(next.getMonth() + 1, 1);
    }

    return next;
  }, [periodStartDate]);
  const resetLabel = useMemo(
    () => resetDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' }),
    [resetDate],
  );

  // Calculate progress for usage
  const usageProgress = useMemo(() => {
    if (planLimit === null) return undefined;
    const percentage = (offersThisMonth / planLimit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      isWarning: percentage >= 90,
      isDanger: percentage >= 100,
    };
  }, [offersThisMonth, planLimit]);

  if (authStatus === 'loading') {
    return (
      <main
        id="main"
        className="flex min-h-[60vh] items-center justify-center px-6 pb-20 pt-24 text-sm font-medium text-fg-muted"
      >
        {t('billing.loading')}
      </main>
    );
  }

  if (!isAuthenticated) {
    return <PublicBillingLanding />;
  }

  return (
    <AppFrame
      title={t('billing.title')}
      description={t('billing.description')}
      requireAuth={false}
      redirectOnUnauthenticated={false}
    >
      <div className="space-y-10">
        {/* Status Messages */}
        {status === 'success' && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-emerald-800">{t('billing.status.success')}</p>
            </div>
          </div>
        )}
        {status === 'cancel' && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-amber-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-amber-800">{t('billing.status.cancel')}</p>
            </div>
          </div>
        )}

        {/* Current Plan Section */}
        <Card
          as="section"
          className="border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white"
          header={
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('billing.currentPlan.title')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('billing.currentPlan.subtitle')}</p>
              </div>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32 rounded-full" />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  {plan ? t(planLabelKeys[plan]) : '—'}
                </span>
              )}
            </CardHeader>
          }
        >
          {isLoadingData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <UsageStatCard
                title={t('billing.currentPlan.limit.title')}
                value={planLimitLabel}
                helper={t('billing.currentPlan.limit.helper')}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <UsageStatCard
                title={t('billing.currentPlan.offersThisMonth.title')}
                value={offersThisMonthLabel}
                helper={t('billing.currentPlan.offersThisMonth.helper')}
                progress={usageProgress}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              />
              <UsageStatCard
                title={t('billing.currentPlan.remaining.title')}
                value={remainingQuotaLabel}
                helper={t('billing.currentPlan.remaining.helper')}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <UsageStatCard
                title={t('billing.currentPlan.reset.title')}
                value={resetLabel}
                helper={t('billing.currentPlan.reset.helper')}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                }
              />
            </dl>
          )}
        </Card>

        {/* Plan Comparison Table */}
        <Card
          as="section"
          header={
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-900">{t('billing.comparison.title')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('billing.comparison.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="pb-4 text-left font-semibold text-slate-900">
                    {t('billing.comparison.feature')}
                  </th>
                  <th className="pb-4 text-center font-semibold text-slate-700">Free</th>
                  <th className="pb-4 text-center font-semibold text-slate-700">Standard</th>
                  <th className="pb-4 text-center font-bold text-primary">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr className="transition-colors hover:bg-slate-50/50">
                  <td className="py-4 font-medium text-slate-700">
                    {t('billing.comparison.offersPerMonth')}
                  </td>
                  <td className="py-4 text-center text-slate-600">2</td>
                  <td className="py-4 text-center text-slate-600">5</td>
                  <td className="py-4 text-center font-bold text-primary">∞</td>
                </tr>
                <tr className="transition-colors hover:bg-slate-50/50">
                  <td className="py-4 font-medium text-slate-700">
                    {t('billing.comparison.brandLogo')}
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-slate-400">—</span>
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-slate-50/50">
                  <td className="py-4 font-medium text-slate-700">
                    {t('billing.comparison.proTemplates')}
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-slate-400">—</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-slate-400">—</span>
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-slate-50/50">
                  <td className="py-4 font-medium text-slate-700">
                    {t('billing.comparison.aiGeneration')}
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                  <td className="py-4 text-center">
                    <svg
                      className="mx-auto h-5 w-5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Plan Selection Cards */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Válassz csomagot</h2>
            <p className="mt-1 text-sm text-slate-600">
              Válaszd ki a számodra megfelelő előfizetést
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PlanCard
              planType="standard"
              isCurrent={isCurrentStandard}
              isPopular={false}
              isDowngrade={isDowngradeToStandard}
              cta={standardCta}
              plan={plan}
              isLoading={loading === STANDARD_PRICE}
            />
            <PlanCard
              planType="pro"
              isCurrent={isCurrentPro}
              isPopular={true}
              isDowngrade={false}
              cta={proCta}
              plan={plan}
              isLoading={loading === PRO_PRICE}
            />
          </div>
        </section>

        {/* Invoices Section */}
        <Card
          as="section"
          header={
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('billing.invoices.title')}</h2>
                <p className="text-xs text-slate-500">{t('billing.invoices.subtitle')}</p>
              </div>
            </CardHeader>
          }
        >
          <div className="rounded-2xl border-2 border-dashed border-border/60 bg-slate-50/50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-base font-semibold text-slate-700">
              {t('billing.invoices.emptyState.title')}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('billing.invoices.emptyState.description')}
            </p>
          </div>
        </Card>

        {/* Security Section */}
        <Card
          as="section"
          className="bg-gradient-to-br from-slate-50 to-white"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('billing.stripeSecurity.title')}
              </h2>
            </CardHeader>
          }
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="text-sm leading-relaxed text-slate-600">
                {t('billing.stripeSecurity.description')}
              </p>
            </div>
            <div
              className="flex flex-wrap items-center justify-center gap-4 lg:justify-end"
              aria-label={t('billing.stripeSecurity.ariaLabel')}
            >
              {CARD_BRANDS.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-center opacity-80 transition-opacity hover:opacity-100"
                  aria-label={brand.name}
                >
                  {brand.render()}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <div className="rounded-2xl border border-border/60 bg-white/50 p-6">
          <p className="text-sm text-slate-600">
            {t('billing.account.emailLabel')}{' '}
            <span className="font-semibold text-slate-900">{email ?? '—'}</span>
            {hasUnlimitedEmail && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('billing.account.unlimitedBadge')}
              </span>
            )}
          </p>
        </div>
      </div>
    </AppFrame>
  );
}

function PublicBillingLanding() {
  return (
    <main id="main" className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {t('billing.public.badge')}
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
              {t('billing.public.hero.title')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              {t('billing.public.hero.description')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?redirect=/billing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                {t('billing.public.hero.ctaPrimary')}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md"
              >
                {t('billing.public.hero.ctaSecondary')}
              </Link>
            </div>
            <ul className="mx-auto mt-10 max-w-xl space-y-3 text-left text-base text-slate-700">
              {MARKETING_SPOTLIGHT_KEYS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 inline-flex h-2 w-2 flex-none rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900">Válassz csomagot</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Mindkét csomag tartalmazza az összes alapfunkciót, csak a kvóta és a prémium funkciók
              térnek el.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <Card
              as="article"
              className="flex h-full flex-col border-2 border-border/70 bg-white p-8 shadow-lg transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('billing.plans.standard.badge')}
              </div>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                {t('billing.plans.standard.name')}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {t('billing.public.standard.description')}
              </p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">1 490</span>
                <span className="text-base text-slate-500">{t('billing.plans.priceMonthly')}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-4">
                {[
                  t('billing.plans.standard.features.0'),
                  t('billing.plans.standard.features.1'),
                  t('billing.plans.standard.features.2'),
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/billing"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-slate-800 hover:shadow-lg"
              >
                {t('billing.public.standard.cta')}
              </Link>
            </Card>

            <Card
              as="article"
              className="relative flex h-full flex-col border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-white to-white p-8 shadow-xl ring-2 ring-primary/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {t('billing.plans.popularBadge')}
                </span>
              </div>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">{t('billing.plans.pro.name')}</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {t('billing.public.pro.description')}
              </p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">6 990</span>
                <span className="text-base text-slate-500">{t('billing.plans.priceMonthly')}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-4">
                {[
                  t('billing.plans.pro.features.0'),
                  t('billing.plans.pro.features.1'),
                  t('billing.plans.pro.features.2'),
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/login?redirect=/billing"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                {t('billing.public.pro.cta')}
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900">Miért válassz Proponót?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Minden funkció, amire szükséged van a professzionális ajánlatkészítéshez
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {MARKETING_FEATURE_KEYS.map((feature, idx) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="absolute -top-24 -right-24 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all duration-300 group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{t(feature.title)}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {t(feature.description)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <Card className="grid gap-12 p-12 md:gap-16 lg:grid-cols-[0.5fr_1fr]">
            <div className="space-y-6">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                {t('billing.public.steps.badge')}
              </span>
              <h2 className="text-4xl font-bold text-slate-900">{t('billing.public.steps.title')}</h2>
              <p className="text-lg leading-relaxed text-slate-600">
                {t('billing.public.steps.description')}
              </p>
            </div>

            <ol className="relative space-y-6 border-l-2 border-primary/30 pl-8">
              {MARKETING_STEP_KEYS.map((step, index) => (
                <Card
                  as="li"
                  key={step.title}
                  className="relative ml-4 space-y-2 bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  <span className="absolute -left-[52px] grid h-10 w-10 place-items-center rounded-full border-2 border-primary bg-primary/10 font-mono text-sm font-bold text-primary shadow-sm">
                    {index + 1}
                  </span>
                  <p className="text-lg font-bold text-slate-900">{t(step.title)}</p>
                  <p className="text-base leading-relaxed text-slate-600">{t(step.description)}</p>
                </Card>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/10 via-white to-accent/10 py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-r from-primary/12 via-transparent to-accent/12 p-12 shadow-xl md:p-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <span className="inline-block text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                  {t('billing.public.cta.badge')}
                </span>
                <h2 className="text-4xl font-bold text-slate-900">{t('billing.public.cta.title')}</h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  {t('billing.public.cta.description')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/login?redirect=/billing"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  {t('billing.public.cta.primary')}
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/login?redirect=/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-md"
                >
                  {t('billing.public.cta.secondary')}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {t('landing.enterprise.badge')}
                </span>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                  {t('landing.enterprise.title')}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  {t('landing.enterprise.description')}
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    t('landing.enterprise.features.0'),
                    t('landing.enterprise.features.1'),
                    t('landing.enterprise.features.2'),
                    t('landing.enterprise.features.3'),
                    t('landing.enterprise.features.4'),
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="mailto:info@vyndi.com?subject=Enterprise megoldás érdeklődés"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  >
                    {t('landing.enterprise.ctaPrimary')}
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <Link
                    href="/login?redirect=/billing"
                    className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-primary hover:text-primary"
                  >
                    {t('landing.enterprise.ctaSecondary')}
                  </Link>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/30" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-primary/20" />
                          <div className="h-3 w-1/2 rounded bg-primary/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
