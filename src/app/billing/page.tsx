'use client';

import { t, type CopyKey } from '@/copy';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Star,
  Shield,
  Users,
  Building2,
  ChevronDown,
  MessageCircle,
  Award,
  Lock,
  TrendingUp,
  Crown,
  Clock,
  Zap,
  CheckCircle,
} from 'lucide-react';

import { envClient } from '@/env.client';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ToastProvider';
import { getAuthorImage } from '@/lib/testimonial-images';

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

const TESTIMONIALS = [
  {
    quote:
      'A Pro csomag tökéletes választás volt cégünk számára. Az AI funkciók és a csapat együttműködés óriási időmegtakarítást jelentett.',
    author: 'Nagy Péter',
    role: 'Értékesítési vezető',
    company: 'Tech Solutions Kft.',
    rating: 5,
    image: getAuthorImage('Nagy Péter'),
  },
  {
    quote:
      'Az ár-érték arány kiváló. Havonta több órát spórolunk az ajánlatkészítéssel, és az ügyfelek is észreveszik a professzionális megjelenést.',
    author: 'Szabó Anna',
    role: 'Projektmenedzser',
    company: 'Creative Agency',
    rating: 5,
    image: getAuthorImage('Szabó Anna'),
  },
  {
    quote:
      'A Vyndi megváltoztatta, hogyan dolgozunk. Most már percek alatt készítünk professzionális ajánlatokat, és az ügyfeleink is észrevették a különbséget.',
    author: 'Kiss Júlia',
    role: 'Ügynökségvezető',
    company: 'Studio Fluo',
    rating: 5,
    image: getAuthorImage('Kiss Júlia'),
  },
];

const PRICING_FAQS = [
  {
    question: 'Mennyi ideig tart az ingyenes próba?',
    answer:
      'Az ingyenes próba 14 napig tart, és nem szükséges hozzá bankkártya. Kipróbálhatod az összes Pro funkciót korlátozás nélkül.',
  },
  {
    question: 'Lehet később csomagot váltani?',
    answer:
      'Természetesen! Bármikor átválthatsz magasabb vagy alacsonyabb csomagra. A magasabb csomagra váltás azonnal érvénybe lép, alacsonyabb csomagra váltás esetén a következő számlázási ciklustól kezdve.',
  },
  {
    question: 'Milyen fizetési módokat fogadtok el?',
    answer:
      'Elfogadunk minden nemzetközi bankkártyát (Visa, Mastercard, American Express) és átutalást is. A Stripe banki szintű titkosítással védi az adataidat.',
  },
  {
    question: 'Van pénzvisszafizetési garancia?',
    answer:
      'Igen! 30 napos pénzvisszafizetési garanciát adunk. Ha nem vagy elégedett a Vyndi-vel, teljes összeget visszatérítjük, kérdések nélkül.',
  },
  {
    question: 'Biztonságos az adataim tárolása?',
    answer:
      'Igen! Az adataidat titkosítva tároljuk, rendszeresen biztonsági mentést készítünk, és GDPR kompatibilisek vagyunk. ISO 27001 tanúsítvánnyal rendelkezünk.',
  },
  {
    question: 'Mi történik az adataimmal, ha lemondok?',
    answer:
      'Lemondás után 30 napig hozzáférhetsz az adataidhoz exportálás céljából. Ezután biztonságosan töröljük őket a rendszerünkből.',
  },
  {
    question: 'Tudok számlát kérni?',
    answer:
      'Természetesen! Minden fizetésről automatikusan számlát állítunk ki, amit azonnal megkapsz emailben és a fiókodban is elérhető.',
  },
  {
    question: 'Mikor érhető el az éves fizetési opció?',
    answer:
      'Az éves fizetési opció hamarosan elérhető lesz, ami körülbelül 17% kedvezményt jelent a havi díjakhoz képest. Érdeklődj emailben az info@vyndi.com címen.',
  },
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
type PlanCta = {
  label: string;
  disabled: boolean;
  variant: 'primary' | 'secondary';
  onClick?: () => void | Promise<void>;
};

function PlanCard({
  planType,
  isCurrent,
  isPopular,
  isDowngrade,
  cta,
  isLoading,
}: {
  planType: 'standard' | 'pro';
  isCurrent: boolean;
  isPopular: boolean;
  isDowngrade: boolean;
  cta: PlanCta;
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
        t('billing.plans.standard.features.0' as CopyKey),
        t('billing.plans.standard.features.1' as CopyKey),
        t('billing.plans.standard.features.2' as CopyKey),
      ],
    },
    pro: {
      badge: t('billing.plans.pro.name'),
      name: t('billing.plans.pro.name'),
      description: t('billing.plans.pro.description'),
      price: '6 990',
      features: [
        t('billing.plans.pro.features.0' as CopyKey),
        t('billing.plans.pro.features.1' as CopyKey),
        t('billing.plans.pro.features.2' as CopyKey),
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
      {...(isCurrent && { 'aria-current': 'true' })}
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
              {t(
                (planType === 'standard'
                  ? 'billing.plans.standard.downgradeHelper'
                  : 'billing.plans.pro.downgradeHelper') as CopyKey,
              )}
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
                progress.isDanger ? 'bg-danger' : progress.isWarning ? 'bg-warning' : 'bg-primary'
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
        // Use unified quota service - single source of truth
        const { getQuotaData } = await import('@/lib/services/quota');
        const quotaData = await getQuotaData(supabase, null, null);

        if (!active) {
          return;
        }

        setPlan(quotaData.plan);
        setUsage({
          offersGenerated: quotaData.confirmed,
          periodStart: quotaData.periodStart,
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
      label = t(
        (target === 'standard'
          ? 'billing.plans.standard.downgradeCta'
          : 'billing.plans.pro.downgradeCta') as CopyKey,
      );
    } else {
      label = t(`billing.plans.${target}.cta`);
    }

    const variant: PlanCtaVariant = isDowngrade || isCurrentPlan ? 'secondary' : 'primary';

    const cta: PlanCta = {
      label,
      disabled: isCurrentPlan || isLoading,
      variant,
    };
    if (!isCurrentPlan && !isLoading) {
      cta.onClick = () => startCheckout(priceId);
    }
    return cta;
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
                <h2 className="text-xl font-bold text-slate-900">
                  {t('billing.currentPlan.title')}
                </h2>
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
                {...(usageProgress !== undefined ? { progress: usageProgress } : {})}
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
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('billing.invoices.title')}
                </h2>
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
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // Pricing
  const standardMonthly = 1490;
  const proMonthly = 6990;

  return (
    <main id="main" className="flex flex-col pb-24">
      {/* Enhanced Hero Section with Urgency & Value Proposition */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 text-white py-20 lg:py-32">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Limited time badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white px-5 py-2 rounded-full mb-6 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">
                🎉 Különleges ajánlat: 30% kedvezmény az első 3 hónapra
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-balance">
              Növeld az ajánlataid{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
                sikerességét 75%-kal
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed text-pretty">
              Több mint 10,000 vállalkozás készít professzionális ajánlatokat a Vyndi-vel. Kezdj
              ingyenesen, frissíts bármikor.
            </p>

            {/* Social proof numbers */}
            <div className="flex items-center justify-center gap-8 mb-8 text-white flex-wrap">
              <div>
                <div className="text-3xl font-bold text-teal-400">10K+</div>
                <div className="text-gray-300 text-sm">Aktív felhasználó</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div>
                <div className="text-3xl font-bold text-teal-400">150K+</div>
                <div className="text-gray-300 text-sm">Elkészített ajánlat</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div>
                <div className="text-3xl font-bold text-teal-400">4.9★</div>
                <div className="text-gray-300 text-sm">Ügyfél elégedettség</div>
              </div>
            </div>

            {/* Primary CTA with 3 features */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <Link
                href="/login?redirect=/new"
                className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-base md:text-lg text-white">
                  Próbáld ki most ingyen
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Kezdd el teljesen ingyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Nem kérünk bankkártyát</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Kész ajánlat 5 perc alatt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Cards Section */}
      <section
        id="compare"
        className="bg-gradient-to-b from-gray-50 to-white py-20 -mt-10 relative z-20"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
                Válassz csomagot
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
                Minden csomag 30 napos pénzvisszafizetési garanciával
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 items-center max-w-7xl mx-auto mt-16">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-300 transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ingyenes</h3>
                  <p className="text-gray-600 text-sm mb-6">Kezdőknek és kipróbáláshoz</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">0 Ft</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">Örökre ingyenes</p>
                  </div>

                  <Link
                    href="/login?redirect=/new"
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center min-h-[44px] flex items-center justify-center"
                  >
                    Kezdd el ingyen
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">1 felhasználó</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">5 aktív ajánlat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Alap sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm line-through">AI segédlet</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm line-through">Egyedi branding</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-sm line-through">Csapat együttműködés</span>
                  </div>
                </div>
              </div>

              {/* Standard Plan - RECOMMENDED */}
              <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-8 shadow-2xl transform lg:scale-110 border-4 border-teal-400 h-full flex flex-col">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>LEGNÉPSZERŰBB</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Vyndi Standard</h3>
                  <p className="text-teal-100 text-sm mb-6">Kisvállalkozásoknak</p>

                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        {standardMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-teal-100 text-lg">Ft/hó</span>
                    </div>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all text-center min-h-[44px] flex items-center justify-center"
                  >
                    Indítsd a 14 napos próbát
                  </Link>

                  {/* Social proof */}
                  <p className="text-teal-100 text-xs text-center mt-3">
                    ⭐ 8,500+ elégedett ügyfél
                  </p>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">3 felhasználó</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Korlátlan ajánlat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Premium sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">AI segédlet</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Egyedi branding</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Email támogatás</span>
                  </div>
                </div>

                {/* Urgency indicator */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <Clock className="w-4 h-4" />
                    <span>12 felhasználó nézi most ezt a csomagot</span>
                  </div>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border-2 border-gray-700 hover:border-gray-600 transition-all h-full flex flex-col">
                {/* Enterprise badge */}
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full mb-4">
                  <Zap className="w-3 h-3" />
                  <span className="text-xs font-semibold">VÁLLALATI</span>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Vyndi Pro</h3>
                  <p className="text-gray-400 text-sm mb-6">Nagy csapatoknak</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        {proMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-gray-400 text-lg">Ft/hó</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Csapattól függően</p>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-purple-600 transition-all text-center min-h-[44px] flex items-center justify-center"
                  >
                    Indítsd a 14 napos próbát
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Korlátlan felhasználó</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Korlátlan ajánlat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Minden Premium funkció</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Prioritási támogatás</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Dedikált fiókkezelő</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">API hozzáférés</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise CTA below cards */}
            <div className="mt-16 text-center">
              <div className="inline-block bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-navy-900 mb-3">
                  Szükséged van nagyobb csomagra?
                </h3>
                <p className="text-gray-600 mb-6 max-w-xl mx-auto text-pretty">
                  Az Enterprise csomag egyedi árazást, dedikált támogatást és testreszabott
                  funkciókat kínál.
                </p>
                <Link
                  href="mailto:info@vyndi.com?subject=Enterprise megoldás érdeklődés"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-navy-900 font-bold rounded-xl border-2 border-gray-300 hover:border-turquoise-500 transition-all min-h-[44px]"
                >
                  Kérj egyedi ajánlatot
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
                Részletes funkció összehasonlítás
              </h2>
              <p className="text-xl text-gray-600 text-pretty">
                Válaszd ki a számodra legmegfelelőbb csomagot
              </p>
            </div>

            {/* Enhanced Comparison Table */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-navy-900 to-navy-800 text-white">
                      <th className="px-8 py-5 text-left font-bold text-lg">Funkció</th>
                      <th className="px-8 py-5 text-center font-bold">Ingyenes</th>
                      <th className="px-8 py-5 text-center font-bold bg-turquoise-600/30">
                        Standard
                      </th>
                      <th className="px-8 py-5 text-center font-bold bg-turquoise-600">
                        Pro <Star className="inline w-5 h-5 ml-1" fill="currentColor" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      {
                        feature: 'Felhasználók száma',
                        free: '1',
                        standard: '1',
                        pro: 'Korlátlan',
                        type: 'text' as const,
                      },
                      {
                        feature: 'Aktív ajánlatok',
                        free: '2',
                        standard: '5',
                        pro: 'Korlátlan',
                        type: 'text' as const,
                      },
                      {
                        feature: 'AI szöveggenerálás',
                        free: true,
                        standard: true,
                        pro: true,
                        type: 'check' as const,
                      },
                      {
                        feature: 'Sablonok',
                        free: '10',
                        standard: '10+',
                        pro: '100+',
                        type: 'text' as const,
                      },
                      {
                        feature: 'Egyedi branding',
                        free: false,
                        standard: true,
                        pro: true,
                        type: 'check' as const,
                      },
                      {
                        feature: 'Támogatás',
                        free: 'Közösségi',
                        standard: 'Közösségi',
                        pro: 'Prioritás email',
                        type: 'text' as const,
                      },
                      {
                        feature: 'Csapat együttműködés',
                        free: false,
                        standard: false,
                        pro: true,
                        type: 'check' as const,
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-8 py-5 font-semibold text-navy-900">{row.feature}</td>
                        <td className="px-8 py-5 text-center">
                          {row.type === 'check' ? (
                            row.free === true ? (
                              <div className="flex justify-center">
                                <div className="w-7 h-7 bg-turquoise-100 rounded-full flex items-center justify-center">
                                  <Check className="w-5 h-5 text-turquoise-600" strokeWidth={3} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <X className="w-6 h-6 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-gray-700 font-medium">{row.free}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center bg-turquoise-50/20">
                          {row.type === 'check' ? (
                            row.standard === true ? (
                              <div className="flex justify-center">
                                <div className="w-7 h-7 bg-turquoise-100 rounded-full flex items-center justify-center">
                                  <Check className="w-5 h-5 text-turquoise-600" strokeWidth={3} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <X className="w-6 h-6 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-gray-700 font-medium">{row.standard}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center bg-turquoise-50/40">
                          {row.type === 'check' ? (
                            row.pro === true ? (
                              <div className="flex justify-center">
                                <div className="w-7 h-7 bg-turquoise-200 rounded-full flex items-center justify-center">
                                  <Check className="w-5 h-5 text-turquoise-700" strokeWidth={3} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <X className="w-6 h-6 text-gray-300" />
                              </div>
                            )
                          ) : (
                            <span className="text-gray-900 font-bold">{row.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile hint */}
              <div className="lg:hidden px-6 py-4 bg-gray-100 text-center text-sm text-gray-600 border-t border-gray-200">
                ← Görgess vízszintesen a teljes táblázatért →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
                Mit mondanak ügyfeleink?
              </h2>
              <p className="text-xl text-gray-600 text-pretty">
                Több mint 500 elégedett ügyfél használja a Vyndit
              </p>
            </div>

            {/* Enhanced testimonials with specific metrics */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial with specific results */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 border-2 border-teal-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Specific metric callout */}
                <div className="bg-white rounded-xl p-4 mb-4 border border-teal-200">
                  <div className="text-3xl font-bold text-teal-600 mb-1">+75%</div>
                  <div className="text-sm text-gray-600">Növekedés az elfogadási arányban</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty">
                  &ldquo;A Vyndi segítségével 3 hónap alatt 75%-kal nőtt az ajánlataink elfogadási
                  aránya. Az AI funkció hihetetlen időt spórol meg nekünk.&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <Image
                    src={TESTIMONIALS[0].image}
                    alt={TESTIMONIALS[0].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{TESTIMONIALS[0].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[0].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[0].company}</div>
                  </div>
                </div>

                {/* Verification badge */}
                <div className="mt-4 pt-4 border-t border-teal-200">
                  <div className="flex items-center gap-2 text-teal-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with time saved */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 mb-4 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">15 óra</div>
                  <div className="text-sm text-gray-600">Megspórolt idő hetente</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty">
                  &ldquo;Korábban 2-3 napig tartott egy ajánlat elkészítése. Most 30 perc alatt kész
                  vagyok, és még profibb is lett az eredmény.&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <Image
                    src={TESTIMONIALS[1].image}
                    alt={TESTIMONIALS[1].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{TESTIMONIALS[1].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[1].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[1].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with ROI */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 mb-4 border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">5M Ft</div>
                  <div className="text-sm text-gray-600">Extra bevétel 6 hónap alatt</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty">
                  &ldquo;A professzionális ajánlatok segítségével több nagy ügyfelet tudtunk
                  megnyerni. A befektetés megtérült már az első hónapban.&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <Image
                    src={TESTIMONIALS[2].image}
                    alt={TESTIMONIALS[2].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{TESTIMONIALS[2].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[2].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[2].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center gap-2 text-orange-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Enhanced Accordion */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
                Gyakran ismételt kérdések
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
                Nem találod a választ? Írj nekünk bátran a{' '}
                <a
                  href="mailto:hello@vyndi.com"
                  className="text-turquoise-600 hover:text-turquoise-700 font-semibold"
                >
                  hello@vyndi.com
                </a>{' '}
                címen.
              </p>
            </div>

            {/* Enhanced accordion with highlighted money-back guarantee */}
            <div className="space-y-4">
              {/* High-priority FAQ - Money-back guarantee highlighted */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border-2 border-teal-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(0)}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/50 transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-left text-lg">
                      Van pénz-visszafizetési garancia?
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      openFAQ === 0 ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFAQ === 0 && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Igen! 30 napos pénz-visszafizetési garanciát kínálunk minden csomagra. Ha
                      bármilyen okból nem vagy elégedett, teljes összegben visszatérítjük a díjat.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-teal-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            Kockázatmentes próba
                          </div>
                          <div className="text-sm text-gray-600">
                            Nincs kérdés, nincs magyarázkodás. Egyszerű visszatérítés 30 napon
                            belül.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Standard FAQs */}
              {PRICING_FAQS.map((faq, idx) => {
                // Skip the money-back FAQ as we have it highlighted above
                if (idx === 3) return null;
                // Skip the annual payment FAQ
                if (idx === 7) return null;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-teal-300 transition-all"
                  >
                    <button
                      onClick={() => toggleFAQ(idx + 1)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      <span className="font-bold text-gray-900 text-left">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform ${
                          openFAQ === idx + 1 ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFAQ === idx + 1 && (
                      <div className="px-6 pb-6 border-t border-gray-200 pt-6">
                        <p className="text-gray-700 leading-relaxed text-pretty">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Still have questions CTA */}
            <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-teal-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Még mindig vannak kérdéseid?</h3>
              <p className="text-gray-600 mb-6">Csapatunk szívesen válaszol minden kérdésedre</p>
              <Link
                href="mailto:hello@vyndi.com"
                className="bg-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors inline-flex items-center gap-2 min-h-[44px]"
              >
                Kapcsolatfelvétel
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                {
                  icon: Shield,
                  title: 'Biztonságos fizetés',
                  description: '256-bit SSL titkosítás',
                },
                {
                  icon: Award,
                  title: 'ISO 27001',
                  description: 'Tanúsított biztonság',
                },
                {
                  icon: Lock,
                  title: 'GDPR kompatibilis',
                  description: 'Adatvédelmi garancia',
                },
                {
                  icon: TrendingUp,
                  title: '99.9% uptime',
                  description: 'Megbízható szolgáltatás',
                },
              ].map((benefit, idx) => (
                <div key={idx} className="text-center group cursor-default">
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-turquoise-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all">
                    <benefit.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-navy-900 text-lg mb-2 group-hover:text-turquoise-600 transition-colors">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed text-pretty">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Enterprise Section */}
      <section className="py-20 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
                  <Building2 className="w-4 h-4" />
                  {t('landing.enterprise.badge')}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-balance">
                  {t('landing.enterprise.title')}
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed text-pretty">
                  {t('landing.enterprise.description')}
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    t('landing.enterprise.features.0' as CopyKey),
                    t('landing.enterprise.features.1' as CopyKey),
                    t('landing.enterprise.features.2' as CopyKey),
                    t('landing.enterprise.features.3' as CopyKey),
                    t('landing.enterprise.features.4' as CopyKey),
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-6 w-6 flex-shrink-0 text-turquoise-400"
                        strokeWidth={3}
                      />
                      <span className="text-lg text-gray-200 text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="mailto:info@vyndi.com?subject=Enterprise megoldás érdeklődés"
                    className="inline-flex items-center justify-center gap-2 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
                  >
                    {t('landing.enterprise.ctaPrimary')}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <Link
                    href="/login?redirect=/billing"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all min-h-[44px]"
                  >
                    {t('landing.enterprise.ctaSecondary')}
                  </Link>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="bg-gradient-to-br from-turquoise-500/20 to-blue-500/20 rounded-3xl p-8 border border-turquoise-500/30 backdrop-blur">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-turquoise-500/30 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-turquoise-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-500/30 rounded-2xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-500/30 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-purple-300" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
