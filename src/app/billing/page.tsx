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

export default function BillingPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useOptionalAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'standard' | 'pro' | null>(null);
  const [usage, setUsage] = useState<{
    offersGenerated: number;
    periodStart: string | null;
  } | null>(null);

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
      return;
    }

    let active = true;

    (async () => {
      try {
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
        setPlan(effectivePlan);
        setUsage({
          offersGenerated: Number(usageRow?.offers_generated ?? 0),
          periodStart: usageRow?.period_start ?? null,
        });
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load billing information.', error);
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
      alert(message);
      setLoading(null);
    }
  }

  const planLimit = useMemo<number | null>(() => {
    if (plan === 'pro') return null;
    if (plan === 'standard') return 10;
    return 3;
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

  const planCtaBaseClasses = [
    'mt-8 inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed',
  ].join(' ');

  const planCtaVariantClasses: Record<PlanCtaVariant, string> = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400',
    secondary:
      'border border-border bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:bg-white disabled:text-slate-400',
  };

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
      <div className="space-y-8">
        <Card
          as="section"
          header={
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  {t('billing.currentPlan.title')}
                </h2>
                <p className="text-xs text-slate-500">{t('billing.currentPlan.subtitle')}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-slate-600">
                {plan ? t(planLabelKeys[plan]) : '—'}
              </span>
            </CardHeader>
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('billing.currentPlan.limit.title')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{planLimitLabel}</dd>
              <p className="mt-1 text-xs text-slate-500">{t('billing.currentPlan.limit.helper')}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('billing.currentPlan.offersThisMonth.title')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{offersThisMonthLabel}</dd>
              {planLimit !== null && (
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      offersThisMonth >= planLimit
                        ? 'bg-danger'
                        : offersThisMonth >= planLimit * 0.9
                          ? 'bg-warning'
                          : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((offersThisMonth / planLimit) * 100, 100)}%`,
                    }}
                    aria-label={`${Math.min((offersThisMonth / planLimit) * 100, 100).toFixed(0)}% used`}
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {t('billing.currentPlan.offersThisMonth.helper')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('billing.currentPlan.remaining.title')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{remainingQuotaLabel}</dd>
              <p className="mt-1 text-xs text-slate-500">
                {t('billing.currentPlan.remaining.helper')}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('billing.currentPlan.reset.title')}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{resetLabel}</dd>
              <p className="mt-1 text-xs text-slate-500">{t('billing.currentPlan.reset.helper')}</p>
            </div>
          </dl>
        </Card>

        {status === 'success' && (
          <Card className="p-0 border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700">
            {t('billing.status.success')}
          </Card>
        )}
        {status === 'cancel' && (
          <Card className="p-0 border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
            {t('billing.status.cancel')}
          </Card>
        )}

        {/* Plan Comparison Table */}
        <Card
          as="section"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('billing.comparison.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('billing.comparison.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold text-slate-900">
                    {t('billing.comparison.feature')}
                  </th>
                  <th className="pb-3 text-center font-semibold text-slate-900">Free</th>
                  <th className="pb-3 text-center font-semibold text-slate-900">Standard</th>
                  <th className="pb-3 text-center font-semibold text-primary">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3 text-slate-700">{t('billing.comparison.offersPerMonth')}</td>
                  <td className="py-3 text-center">3</td>
                  <td className="py-3 text-center">10</td>
                  <td className="py-3 text-center font-semibold text-primary">∞</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-700">{t('billing.comparison.brandLogo')}</td>
                  <td className="py-3 text-center">—</td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-700">{t('billing.comparison.proTemplates')}</td>
                  <td className="py-3 text-center">—</td>
                  <td className="py-3 text-center">—</td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-700">{t('billing.comparison.aiGeneration')}</td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                  <td className="py-3 text-center">
                    <svg className="mx-auto h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <Card
            as="article"
            className={[
              'flex h-full flex-col',
              isCurrentStandard
                ? 'border-primary/60 bg-white shadow-lg ring-2 ring-primary/15'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isCurrentStandard ? 'true' : undefined}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{t('billing.plans.standard.badge')}</span>
              {isCurrentStandard && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
                  {t('billing.plans.currentBadge')}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {t('billing.plans.standard.name')}
            </h2>
            <p className="mt-3 text-sm text-slate-500">{t('billing.plans.standard.description')}</p>
            {isDowngradeToStandard && !isCurrentStandard && (
              <p className="mt-2 text-xs font-medium text-amber-600">
                {t('billing.plans.standard.downgradeHelper')}
              </p>
            )}
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">1 490</span>
              <span className="text-sm text-slate-500">{t('billing.plans.priceMonthly')}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>{t('billing.plans.standard.features.0')}</li>
              <li>{t('billing.plans.standard.features.1')}</li>
              <li>{t('billing.plans.standard.features.2')}</li>
            </ul>
            <Button
              onClick={standardCta.onClick}
              disabled={standardCta.disabled}
              className={[planCtaBaseClasses, planCtaVariantClasses[standardCta.variant]].join(' ')}
              aria-disabled={standardCta.disabled}
            >
              {standardCta.label}
            </Button>
          </Card>

          <Card
            as="article"
            className={[
              'flex h-full flex-col bg-white shadow-lg ring-1 ring-slate-900/5',
              isCurrentPro ? 'border-primary/60 ring-primary/20' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isCurrentPro ? 'true' : undefined}
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {t('billing.plans.popularBadge')}
            </div>
            {isCurrentPro && (
              <span className="mt-3 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {t('billing.plans.currentBadge')}
              </span>
            )}
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {t('billing.plans.pro.name')}
            </h2>
            <p className="mt-3 text-sm text-slate-500">{t('billing.plans.pro.description')}</p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">6 990</span>
              <span className="text-sm text-slate-500">{t('billing.plans.priceMonthly')}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>{t('billing.plans.pro.features.0')}</li>
              <li>{t('billing.plans.pro.features.1')}</li>
              <li>{t('billing.plans.pro.features.2')}</li>
            </ul>
            <Button
              onClick={proCta.onClick}
              disabled={proCta.disabled}
              className={[planCtaBaseClasses, planCtaVariantClasses[proCta.variant]].join(' ')}
              aria-disabled={proCta.disabled}
            >
              {proCta.label}
            </Button>
          </Card>
        </section>

        <Card
          as="section"
          header={
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  {t('billing.invoices.title')}
                </h2>
                <p className="text-xs text-slate-500">{t('billing.invoices.subtitle')}</p>
              </div>
            </CardHeader>
          }
        >
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 p-8 text-center">
            <h3 className="text-sm font-semibold text-slate-700">
              {t('billing.invoices.emptyState.title')}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('billing.invoices.emptyState.description')}
            </p>
            <Button variant="secondary" size="sm" disabled className="pointer-events-none mt-4">
              {t('billing.invoices.emptyState.cta')}
            </Button>
          </div>
        </Card>

        <Card
          as="section"
          header={
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-700">
                {t('billing.stripeSecurity.title')}
              </h2>
            </CardHeader>
          }
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="text-sm text-slate-500">{t('billing.stripeSecurity.description')}</p>
            </div>
            <div
              className="flex flex-wrap items-center gap-4"
              aria-label={t('billing.stripeSecurity.ariaLabel')}
            >
              {CARD_BRANDS.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center justify-center"
                  aria-label={brand.name}
                >
                  {brand.render()}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <p className="text-sm text-slate-500">
          {t('billing.account.emailLabel')}{' '}
          <span className="font-medium text-slate-700">{email ?? '—'}</span>
          {hasUnlimitedEmail && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {t('billing.account.unlimitedBadge')}
            </span>
          )}
        </p>
      </div>
    </AppFrame>
  );
}

function PublicBillingLanding() {
  return (
    <main id="main" className="flex flex-col gap-24 pb-24">
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <div className="space-y-7">
          <span className="inline-flex w-fit items-center rounded-full border border-primary bg-primary/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('billing.public.badge')}
          </span>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-[-0.1rem] text-[#1c274c] md:text-5xl">
            {t('billing.public.hero.title')}
          </h1>
          <p className="max-w-[60ch] text-base leading-[1.7] text-fg-muted md:text-lg">
            {t('billing.public.hero.description')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login?redirect=/billing"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
            >
              {t('billing.public.hero.ctaPrimary')}
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
            >
              {t('billing.public.hero.ctaSecondary')}
            </Link>
          </div>
          <ul className="space-y-4 text-base text-fg">
            {MARKETING_SPOTLIGHT_KEYS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-2 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-fg-muted">{t(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            as="article"
            className="flex h-full flex-col border border-border/70 bg-bg/80 p-6 shadow-card"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('billing.plans.standard.badge')}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {t('billing.plans.standard.name')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {t('billing.public.standard.description')}
            </p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">1 490</span>
              <span className="text-sm text-slate-500">{t('billing.plans.priceMonthly')}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>{t('billing.plans.standard.features.0')}</li>
              <li>{t('billing.plans.standard.features.1')}</li>
              <li>{t('billing.plans.standard.features.2')}</li>
            </ul>
            <Link
              href="/login?redirect=/billing"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {t('billing.public.standard.cta')}
            </Link>
          </Card>

          <Card
            as="article"
            className="flex h-full flex-col bg-white p-6 shadow-lg ring-1 ring-slate-900/5"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {t('billing.plans.popularBadge')}
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {t('billing.plans.pro.name')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {t('billing.public.pro.description')}
            </p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">6 990</span>
              <span className="text-sm text-slate-500">{t('billing.plans.priceMonthly')}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>{t('billing.plans.pro.features.0')}</li>
              <li>{t('billing.plans.pro.features.1')}</li>
              <li>{t('billing.plans.pro.features.2')}</li>
            </ul>
            <Link
              href="/login?redirect=/billing"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {t('billing.public.pro.cta')}
            </Link>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-3">
        {MARKETING_FEATURE_KEYS.map((feature) => (
          <Card
            key={feature.title}
            className="group relative overflow-hidden p-8 transition duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop"
          >
            <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition duration-200 ease-out group-hover:scale-125" />
            <h3 className="text-xl font-semibold text-fg">{t(feature.title)}</h3>
            <p className="mt-4 text-base leading-relaxed text-fg-muted">{t(feature.description)}</p>
          </Card>
        ))}
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        <Card as="section" className="grid gap-12 p-12 md:gap-14 lg:grid-cols-[0.55fr_1fr]">
          <div className="space-y-7">
            <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
              {t('billing.public.steps.badge')}
            </span>
            <h2 className="text-3xl font-semibold text-fg">{t('billing.public.steps.title')}</h2>
            <p className="text-base leading-relaxed text-fg-muted">
              {t('billing.public.steps.description')}
            </p>
          </div>

          <ol className="relative space-y-5 border-l border-border/60 pl-6">
            {MARKETING_STEP_KEYS.map((step, index) => (
              <Card as="li" key={step.title} className="relative space-y-2 bg-bg p-5">
                <span className="absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                  {index + 1}
                </span>
                <p className="text-base font-semibold">{t(step.title)}</p>
                <p className="text-base leading-relaxed text-fg-muted">{t(step.description)}</p>
              </Card>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
        <Card
          as="section"
          className="overflow-hidden border border-primary/40 bg-gradient-to-r from-primary/12 via-transparent to-accent/12 p-12 shadow-pop"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
                {t('billing.public.cta.badge')}
              </span>
              <h2 className="text-3xl font-semibold text-fg">{t('billing.public.cta.title')}</h2>
              <p className="text-base leading-relaxed text-fg-muted">
                {t('billing.public.cta.description')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login?redirect=/billing"
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
              >
                {t('billing.public.cta.primary')}
              </Link>
              <Link
                href="/new"
                className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
              >
                {t('billing.public.cta.secondary')}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
