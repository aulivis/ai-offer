'use client';

import { t, type CopyKey } from '@/copy';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useSearchParams } from 'next/navigation';
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
  TrendingDown,
  Crown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  FileText,
  Infinity,
  Receipt,
  Pause,
  Target,
  Palette,
  Headphones,
  Building,
} from 'lucide-react';

import { envClient } from '@/env.client';
import AppFrame from '@/components/AppFrame';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { ButtonProps } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1 } from '@/components/ui/Heading';
import { useToast } from '@/hooks/useToast';
import { getAuthorImage } from '@/lib/testimonial-images';
import {
  calculateAnnualPrice,
  calculateEffectiveMonthlyPrice,
  calculateAnnualSavings,
  formatPrice,
  type BillingInterval,
} from '@/lib/billing';

type CardBrand = {
  name: string;
  render: () => JSX.Element;
};

const CARD_BRANDS: CardBrand[] = [
  {
    name: 'Visa',
    render: () => <span className="text-h5 font-bold tracking-[0.35em] text-navy-900">VISA</span>,
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
        <span className="text-body-small font-semibold tracking-[0.2em] text-fg">DISCOVER</span>
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
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-muted">
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#0a3a66]" />
        </span>
        <span className="text-body-small font-semibold tracking-[0.2em] text-fg-muted">DINERS</span>
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

const STANDARD_PRICE_MONTHLY = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const PRO_PRICE_MONTHLY = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const STANDARD_PRICE_ANNUAL = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL;
const PRO_PRICE_ANNUAL = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL;

// Monthly prices for calculation (HUF)
const MONTHLY_PRICES = {
  standard: 1490,
  pro: 6990,
} as const;

// Discount percentage for annual billing (17% = ~2 months free)
const ANNUAL_DISCOUNT_PERCENT = 17;

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
    question: 'Mennyi ideig használhatom ingyen a Vyndit?',
    answer:
      'A Vyndi alapcsomagja örökre ingyenes.\n\nNincs időkorlát, nincs bankkártya, nincs kötelező frissítés.',
  },
  {
    question: 'Lehet később csomagot váltani?',
    answer:
      'Igen.\n\nBármikor válthatsz feljebb vagy lejjebb.\n\n– Felfelé váltás: azonnal érvényes\n\n– Lefelé váltás: következő számlázási ciklustól',
  },
  {
    question: 'Milyen fizetési módokat fogadtok el?',
    answer:
      'Bankkártyás fizetés: Visa, Mastercard, American Express, Google Pay, Apple Pay.\n\nA Stripe biztonságos, banki szintű titkosítást használ.',
  },
  {
    question: 'Van pénzvisszafizetési garancia?',
    answer: '',
  },
  {
    question: 'Biztonságos az adataim tárolása?',
    answer:
      'Igen.\n\nAdataid titkosított kapcsolaton (SSL) keresztül kerülnek feldolgozásra, GDPR-kompatibilis módon.\n\nRendszeres biztonsági mentést végzünk.',
  },
  {
    question: 'Mi történik az adataimmal, ha lemondom az előfizetést?',
    answer:
      'Lemondás után 30 napig hozzáférsz az adatok exportálásához.\n\nEzután a rendszer biztonságosan véglegesen törli őket.',
  },
  {
    question: 'Tudok számlát kérni?',
    answer:
      'Igen.\n\nMinden fizetésről automatikusan számlát állítunk ki, amit emailben is megkapsz és a fiókodban is elérsz.',
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
  plan,
  isLoading,
  billingInterval,
}: {
  planType: 'standard' | 'pro';
  isCurrent: boolean;
  isPopular: boolean;
  isDowngrade: boolean;
  cta: PlanCta;
  plan: 'free' | 'standard' | 'pro' | null;
  isLoading: boolean;
  billingInterval: BillingInterval;
}) {
  const monthlyPrice = MONTHLY_PRICES[planType];

  // Calculate pricing based on interval
  const displayPrice =
    billingInterval === 'annual'
      ? calculateAnnualPrice(monthlyPrice, ANNUAL_DISCOUNT_PERCENT)
      : monthlyPrice;

  const effectiveMonthlyPrice =
    billingInterval === 'annual'
      ? calculateEffectiveMonthlyPrice(monthlyPrice, ANNUAL_DISCOUNT_PERCENT)
      : monthlyPrice;

  const savings =
    billingInterval === 'annual'
      ? calculateAnnualSavings(monthlyPrice, ANNUAL_DISCOUNT_PERCENT)
      : null;

  const planData = {
    standard: {
      badge: t('billing.plans.standard.badge'),
      name: t('billing.plans.standard.name'),
      description: t('billing.plans.standard.description'),
      price: formatPrice(displayPrice),
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
      price: formatPrice(displayPrice),
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
          : isDowngrade && !isCurrent
            ? 'border-border/70 bg-white shadow-lg opacity-75 hover:opacity-100 hover:shadow-xl hover:-translate-y-1'
            : isPopular && !isCurrent
              ? 'border-2 border-primary/60 bg-gradient-to-br from-primary/5 via-white to-white shadow-2xl ring-4 ring-primary/30 hover:shadow-2xl hover:-translate-y-1 scale-105'
              : 'border-border/70 bg-white shadow-lg hover:shadow-xl hover:-translate-y-1',
      ]
        .filter(Boolean)
        .join(' ')}
      {...(isCurrent && { 'aria-current': 'true' })}
    >
      {/* Popular Badge - Enhanced */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-5 py-1.5 text-body-small font-bold text-white shadow-2xl animate-pulse border-2 border-white/30">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('billing.plans.popularBadge')}
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-body-small font-semibold text-primary">
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

      {/* Downgrade Badge - Previous Plan */}
      {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
        <div className="absolute top-6 right-6">
          <span className="px-3 py-1 bg-bg-muted text-fg rounded-full text-body-small font-bold">
            Korábbi csomag
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Plan Badge */}
        {!isCurrent && (
          <div className="mb-3 text-body-small font-semibold uppercase tracking-wider text-fg-muted">
            {planType === 'standard' ? t('billing.plans.standard.badge') : ''}
          </div>
        )}

        {/* Plan Name */}
        <h3 className="text-h3 font-bold tracking-tight text-fg">{data.name}</h3>

        {/* Description */}
        <p className="mt-3 text-body-small leading-typography-relaxed text-fg-muted">
          {data.description}
        </p>

        {/* Downgrade Warning - Enhanced for Pro users viewing Standard */}
        {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
          <div className="mt-4 bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-body-small text-warning">
                <p className="font-semibold mb-1">Visszalépés esetén elveszíted:</p>
                <ul className="space-y-1 text-body-small">
                  <li>• Korlátlan ajánlatok (csak 5/hó)</li>
                  <li>• AI generált szövegek</li>
                  <li>• Prémium sablonok</li>
                  <li>• Prioritásos támogatás</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Standard downgrade warning for other cases */}
        {isDowngrade && !isCurrent && !(plan === 'pro' && planType === 'standard') && (
          <div className="mt-3 rounded-lg bg-warning/10 border border-warning/30 p-3">
            <p className="text-body-small font-medium text-warning/90">
              {t(
                (planType === 'standard'
                  ? 'billing.plans.standard.downgradeHelper'
                  : 'billing.plans.pro.downgradeHelper') as CopyKey,
              )}
            </p>
          </div>
        )}

        {/* Price */}
        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-h1 font-bold text-fg">{data.price}</span>
            <span className="text-body-small font-medium text-fg-muted">
              {billingInterval === 'annual' ? 'Ft/év' : 'Ft/hó'}
            </span>
          </div>

          {/* Annual billing: show effective monthly price and savings */}
          {billingInterval === 'annual' && savings && (
            <div className="mt-2 space-y-1">
              <p className="text-body-small text-fg-muted">
                Effektíve {formatPrice(effectiveMonthlyPrice)} Ft/hó
              </p>
              <p className="text-body-small font-semibold text-primary">
                {formatPrice(savings.totalSavings)} Ft megtakarítás/év ({savings.percentageSaved}%)
              </p>
            </div>
          )}

          {/* Monthly billing: show per month */}
          {billingInterval === 'monthly' && (
            <p className="mt-1 text-body-small text-fg-muted">havonta számlázva</p>
          )}
        </div>

        {/* Savings message for downgrade */}
        {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
          <p className="text-body-small text-fg-muted mt-2">Visszalépés 5 500 Ft/hó megtakarítás</p>
        )}

        {/* Features List */}
        <ul className="mt-6 flex-1 space-y-3">
          {data.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-body-small text-fg">{feature}</span>
            </li>
          ))}

          {/* Show removed features with strikethrough for Pro downgrading to Standard */}
          {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
            <>
              <li className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                <span className="text-body-small text-fg-muted/60 line-through">
                  Korlátlan ajánlatok
                </span>
              </li>
              <li className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                <span className="text-body-small text-fg-muted/60 line-through">
                  AI generált szövegek
                </span>
              </li>
            </>
          )}
        </ul>

        {/* CTA Button */}
        <Button
          onClick={cta.onClick}
          disabled={cta.disabled}
          variant={cta.variant}
          size="lg"
          className={[
            'mt-8 w-full',
            isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard'
              ? 'bg-bg-muted hover:bg-bg text-fg-muted'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          loading={isLoading}
        >
          {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard'
            ? 'Visszalépés Standard-ra'
            : cta.label}
        </Button>
      </div>
    </Card>
  );
}

export default function BillingPage() {
  return (
    <PageErrorBoundary>
      <BillingPageContent />
    </PageErrorBoundary>
  );
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  // Get authentication status
  const { status: authStatus, user } = useOptionalAuth();

  // Use the subscription management hook
  const { plan, usage, isLoadingData, loading, email, planLimit, startCheckout } =
    useSubscriptionManagement();

  useEffect(() => {
    setStatus(searchParams?.get('status') || null);
  }, [searchParams]);

  type PlanCtaVariant = Extract<ButtonProps['variant'], 'primary' | 'secondary'>;

  const getPlanCta = (target: PaidPlan) => {
    // Get price ID based on billing interval
    const priceId =
      billingInterval === 'annual'
        ? target === 'standard'
          ? STANDARD_PRICE_ANNUAL || STANDARD_PRICE_MONTHLY
          : PRO_PRICE_ANNUAL || PRO_PRICE_MONTHLY
        : target === 'standard'
          ? STANDARD_PRICE_MONTHLY
          : PRO_PRICE_MONTHLY;

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
      disabled: isLoading,
      variant: isCurrentPlan ? 'secondary' : variant,
    };
    if (isCurrentPlan) {
      // For current plan, scroll to management section
      cta.onClick = () => {
        const managementSection = document.getElementById('subscription-management');
        if (managementSection) {
          managementSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          showToast({
            title: 'Előfizetés kezelése',
            description: 'Görgessen le az előfizetés kezelése szekcióhoz.',
            variant: 'info',
          });
        }
      };
    } else if (!isLoading) {
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

  // Show public landing page if not authenticated or still loading
  // This prevents redirect loops and ensures public users see the pricing page
  if (authStatus !== 'authenticated' || !user) {
    if (authStatus === 'loading') {
      return (
        <main
          id="main"
          className="flex min-h-[60vh] items-center justify-center px-6 pb-20 pt-24 text-body-small font-medium text-fg-muted"
        >
          {t('billing.loading')}
        </main>
      );
    }
    return <PublicBillingLanding />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50">
      <AppFrame
        title={t('billing.title')}
        description={t('billing.description')}
        requireAuth={false}
        redirectOnUnauthenticated={false}
      >
        <div className="space-y-10">
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={[{ label: t('billing.title') }]} />
          {/* Status Messages */}
          {status === 'success' && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-body-small font-medium text-success">
                  {t('billing.status.success')}
                </p>
              </div>
            </div>
          )}
          {status === 'cancel' && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-body-small font-medium text-warning">
                  {t('billing.status.cancel')}
                </p>
              </div>
            </div>
          )}

          {/* Current Plan Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h2 font-bold text-fg mb-2">{t('billing.currentPlan.title')}</h2>
                <p className="text-fg-muted">{t('billing.currentPlan.subtitle')}</p>
              </div>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32 rounded-full" />
              ) : (
                <span className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  {plan ? t(planLabelKeys[plan]) : '—'}
                </span>
              )}
            </div>

            {isLoadingData ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {/* Card 1: Usage - Most important, make it prominent */}
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-body-small font-bold uppercase tracking-wide opacity-90">
                      Havi használat
                    </div>
                  </div>
                  <div className="text-display font-bold mb-2">{offersThisMonth}</div>
                  <div className="text-body-small opacity-90 mb-4">
                    ajánlat készítve ebben a hónapban
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center justify-between text-body-small mb-2">
                      <span className="opacity-90">
                        {planLimit === null ? 'Korlátlan kvóta' : planLimitLabel}
                      </span>
                      {planLimit === null && <Infinity className="w-5 h-5" />}
                    </div>
                    {planLimit === null ? (
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full animate-pulse"
                          style={{ width: `${Math.min((offersThisMonth / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    ) : usageProgress ? (
                      <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            usageProgress.isDanger
                              ? 'bg-danger/30'
                              : usageProgress.isWarning
                                ? 'bg-warning/30'
                                : 'bg-bg-muted'
                          }`}
                          style={{ width: `${Math.min(usageProgress.percentage, 100)}%` }}
                        ></div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card 2: Unlimited quota explanation or remaining */}
                <div className="bg-bg-muted rounded-2xl p-6 shadow-lg border-2 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      {planLimit === null ? (
                        <Infinity className="w-5 h-5 text-primary" />
                      ) : (
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="text-body-small font-bold uppercase tracking-wide text-fg-muted">
                      {planLimit === null
                        ? 'Felhasználási keret'
                        : t('billing.currentPlan.remaining.title')}
                    </div>
                  </div>
                  <div className="text-h1 font-bold text-fg mb-2">
                    {planLimit === null ? 'Korlátlan' : remainingQuotaLabel}
                  </div>
                  <div className="text-body-small text-fg-muted mb-4">
                    {planLimit === null
                      ? 'Ajánlatok készítése'
                      : t('billing.currentPlan.remaining.helper')}
                  </div>

                  {planLimit === null && (
                    <div className="flex items-center gap-2 text-body-small text-primary bg-primary/10 px-3 py-2 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-semibold">Pro előny</span>
                    </div>
                  )}
                </div>

                {/* Card 3: Next billing date with countdown */}
                <div className="bg-bg-muted rounded-2xl p-6 shadow-lg border-2 border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-body-small font-bold uppercase tracking-wide text-fg-muted">
                      Következő fizetés
                    </div>
                  </div>
                  <div className="text-h1 font-bold text-fg mb-2">
                    {resetDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-body-small text-fg-muted mb-4">{resetLabel}</div>

                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = resetDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div className="text-body-small text-fg-muted bg-bg-muted px-3 py-2 rounded-lg">
                        {diffDays > 0 ? `${diffDays} nap múlva` : 'Ma'} • Automatikus megújulás
                      </div>
                    );
                  })()}
                </div>

                {/* Card 4: Payment amount */}
                <div className="bg-bg-muted rounded-2xl p-6 shadow-lg border-2 border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-body-small font-bold uppercase tracking-wide text-fg-muted">
                      Havi díjszabás
                    </div>
                  </div>
                  <div className="text-h1 font-bold text-fg mb-2">
                    {plan === 'pro'
                      ? formatPrice(MONTHLY_PRICES.pro)
                      : plan === 'standard'
                        ? formatPrice(MONTHLY_PRICES.standard)
                        : '0'}{' '}
                    Ft
                  </div>
                  <div className="text-body-small text-fg-muted mb-4">havonta számlázva</div>

                  {plan === 'pro' && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/stripe/update-subscription', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ billingInterval: 'annual' }),
                          });

                          const data = await response.json();

                          if (!response.ok) {
                            showToast({
                              title: 'Hiba történt',
                              description: data.error || 'Nem sikerült átállítani az előfizetést.',
                              variant: 'error',
                            });
                            return;
                          }

                          showToast({
                            title: 'Sikeres váltás',
                            description:
                              'Az előfizetésedet éves számlázásra állítottuk. A változás azonnal érvénybe lép.',
                            variant: 'success',
                          });

                          // Reload page to show updated billing info
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        } catch (_error) {
                          showToast({
                            title: 'Hiba történt',
                            description: 'Nem sikerült kapcsolódni a szerverhez.',
                            variant: 'error',
                          });
                        }
                      }}
                      className="text-body-small text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      Éves fizetésre váltás
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pro Benefits Showcase for Pro users, Comparison Table for others */}
          {plan === 'pro' ? (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h3 className="text-h3 font-bold text-fg mb-3">A Vyndi Pro előnyei</h3>
                <p className="text-fg-muted">Nézd meg, mit kapsz a Pro csomagban</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-primary/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
                    <Infinity className="w-6 h-6 text-primary-ink" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">Korlátlan ajánlatok</h4>
                  <p className="text-body-small text-fg mb-4">
                    Készíts annyi ajánlatot, amennyit csak szeretnél. Nincs havi limit.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-primary">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">AI szövegírás</h4>
                  <p className="text-body-small text-fg-muted mb-4">
                    Generálj professzionális ajánlatszövegeket mesterséges intelligenciával.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-primary">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">Prémium sablonok</h4>
                  <p className="text-body-small text-fg-muted mb-4">
                    Hozzáférés 15+ exkluzív, professzionális ajánlat sablonhoz.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-warning">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">Prioritásos support</h4>
                  <p className="text-body-small text-fg-muted mb-4">
                    1 órán belüli válaszidő minden kérdésedre és problémádra.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-success">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">PDF export márkázással</h4>
                  <p className="text-body-small text-fg-muted mb-4">
                    Töltsd le ajánlataidat professzionális PDF formátumban, saját logóval.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-primary">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-h5 font-bold text-fg mb-2">Haladó elemzések</h4>
                  <p className="text-body-small text-fg-muted mb-4">
                    Részletes statisztikák az ajánlataidról és az ügyfél interakciókról.
                  </p>
                  <div className="flex items-center gap-2 text-body-small text-primary">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card
              as="section"
              header={
                <CardHeader>
                  <h2 className="text-h4 font-bold text-fg">{t('billing.comparison.title')}</h2>
                  <p className="mt-1 text-body-small text-fg-muted leading-typography-normal">
                    {t('billing.comparison.subtitle')}
                  </p>
                </CardHeader>
              }
            >
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-body-small">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="pb-4 text-left font-semibold text-fg">
                        {t('billing.comparison.feature')}
                      </th>
                      <th className="pb-4 text-center font-semibold text-fg">Free</th>
                      <th className="pb-4 text-center font-semibold text-fg">Standard</th>
                      <th className="pb-4 text-center font-bold text-primary">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="transition-colors hover:bg-bg-muted/50">
                      <td className="py-4 font-medium text-fg">
                        {t('billing.comparison.offersPerMonth')}
                      </td>
                      <td className="py-4 text-center text-fg-muted">2</td>
                      <td className="py-4 text-center text-fg-muted">5</td>
                      <td className="py-4 text-center font-bold text-primary">∞</td>
                    </tr>
                    <tr className="transition-colors hover:bg-bg-muted/50">
                      <td className="py-4 font-medium text-fg">
                        {t('billing.comparison.brandLogo')}
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-fg-muted">—</span>
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-bg-muted/50">
                      <td className="py-4 font-medium text-fg">
                        {t('billing.comparison.proTemplates')}
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-fg-muted">—</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-fg-muted">—</span>
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-bg-muted/50">
                      <td className="py-4 font-medium text-fg">
                        {t('billing.comparison.aiGeneration')}
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Plan Selection Cards */}
          <section>
            <div className="mb-6">
              <h2 className="text-h4 font-bold text-fg">Válassz csomagot</h2>
              <p className="mt-1 text-body-small text-fg-muted leading-typography-normal">
                Válaszd ki a számodra megfelelő előfizetést
              </p>

              {/* Billing Interval Toggle */}
              {STANDARD_PRICE_ANNUAL || PRO_PRICE_ANNUAL ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`px-4 py-2 text-body-small font-semibold rounded-lg transition-all ${
                      billingInterval === 'monthly'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-bg-muted text-fg-muted hover:bg-bg'
                    }`}
                  >
                    Havi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('annual')}
                    className={`px-4 py-2 text-body-small font-semibold rounded-lg transition-all relative ${
                      billingInterval === 'annual'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-bg-muted text-fg-muted hover:bg-bg'
                    }`}
                  >
                    Éves
                    {billingInterval === 'annual' && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-ink text-caption font-bold px-2 py-0.5 rounded-full">
                        -{ANNUAL_DISCOUNT_PERCENT}%
                      </span>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <PlanCard
                planType="standard"
                isCurrent={isCurrentStandard}
                isPopular={false}
                isDowngrade={isDowngradeToStandard}
                cta={standardCta}
                plan={plan}
                isLoading={
                  loading ===
                  (billingInterval === 'annual' ? STANDARD_PRICE_ANNUAL : STANDARD_PRICE_MONTHLY)
                }
                billingInterval={billingInterval}
              />
              <PlanCard
                planType="pro"
                isCurrent={isCurrentPro}
                isPopular={true}
                isDowngrade={false}
                cta={proCta}
                plan={plan}
                isLoading={
                  loading === (billingInterval === 'annual' ? PRO_PRICE_ANNUAL : PRO_PRICE_MONTHLY)
                }
                billingInterval={billingInterval}
              />
            </div>
          </section>

          {/* Subscription Management Section */}
          {(plan === 'pro' || plan === 'standard') && (
            <div id="subscription-management" className="mb-12 scroll-mt-8">
              <h3 className="text-h3 font-bold text-fg mb-6">Előfizetés kezelése</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment method card */}
                <Card className="border-2 border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-6 h-6 text-fg" />
                      <h4 className="text-h5 font-bold text-fg">Fizetési mód</h4>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-fg">Nincs mentett kártya</div>
                        <div className="text-body-small text-fg-muted leading-typography-normal">
                          A fizetés a Stripe-en keresztül történik
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        showToast({
                          title: 'Kártya frissítése',
                          description: 'Ez a funkció hamarosan elérhető lesz.',
                          variant: 'info',
                        });
                      }}
                    >
                      Kártya frissítése
                    </Button>
                  </div>
                </Card>

                {/* Billing frequency card */}
                <Card className="border-2 border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-6 h-6 text-fg" />
                      <h4 className="text-h5 font-bold text-fg">Számlázási gyakoriság</h4>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-fg">Havi fizetés</div>
                        <div className="text-body-small text-fg-muted">
                          {plan === 'pro'
                            ? formatPrice(MONTHLY_PRICES.pro)
                            : formatPrice(MONTHLY_PRICES.standard)}{' '}
                          Ft / hónap
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-body-small font-bold">
                        Aktív
                      </span>
                    </div>

                    {plan === 'pro' && (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <TrendingDown className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-body-small font-semibold text-success mb-1">
                              Takarítsd meg 13 980 Ft-ot évente!
                            </p>
                            <p className="text-caption text-success">
                              Éves fizetéssel 2 hónap ingyen: 6 290 Ft/hó (75 480 Ft/év)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/stripe/update-subscription', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ billingInterval: 'annual' }),
                          });

                          const data = await response.json();

                          if (!response.ok) {
                            showToast({
                              title: 'Hiba történt',
                              description: data.error || 'Nem sikerült átállítani az előfizetést.',
                              variant: 'error',
                            });
                            return;
                          }

                          showToast({
                            title: 'Sikeres váltás',
                            description:
                              'Az előfizetésedet éves számlázásra állítottuk. A változás azonnal érvénybe lép.',
                            variant: 'success',
                          });

                          // Reload page to show updated billing info
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        } catch (_error) {
                          showToast({
                            title: 'Hiba történt',
                            description: 'Nem sikerült kapcsolódni a szerverhez.',
                            variant: 'error',
                          });
                        }
                      }}
                    >
                      Váltás éves fizetésre
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Invoices Section */}
          <Card
            as="section"
            header={
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-h5 font-semibold text-fg">{t('billing.invoices.title')}</h2>
                  <p className="text-caption text-fg-muted">{t('billing.invoices.subtitle')}</p>
                </div>
              </CardHeader>
            }
          >
            <div className="bg-bg-muted rounded-2xl p-12 shadow-lg border-2 border-border">
              {/* Icon */}
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-10 h-10 text-primary" />
              </div>

              {/* Message */}
              <h4 className="text-h4 font-bold text-fg mb-3 text-center">
                {t('billing.invoices.emptyState.title')}
              </h4>
              <p className="text-fg-muted mb-8 max-w-md mx-auto text-center">
                Az első számlád automatikusan generálódik a következő fizetési időpontban
              </p>

              {/* Next invoice info card */}
              {(plan === 'pro' || plan === 'standard') && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 max-w-lg mx-auto mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-fg mb-3">Következő számla</h5>
                      <div className="space-y-2 text-body-small">
                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted">Dátum:</span>
                          <span className="font-semibold text-fg">{resetLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted">Összeg:</span>
                          <span className="font-semibold text-fg">
                            {plan === 'pro'
                              ? formatPrice(MONTHLY_PRICES.pro)
                              : formatPrice(MONTHLY_PRICES.standard)}{' '}
                            Ft
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted">Formátum:</span>
                          <span className="font-semibold text-fg">PDF letöltés</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-fg-muted">Email:</span>
                          <span className="font-semibold text-fg">Automatikus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info about billing address */}
              <div className="text-center">
                <p className="text-body-small text-fg-muted mb-3">
                  A számlázási adataid a Beállítások → Cégadatok menüpontban módosíthatók
                </p>
                <Link
                  href="/settings"
                  className="text-primary font-semibold hover:underline flex items-center gap-2 mx-auto justify-center"
                >
                  <Building className="w-4 h-4" />
                  Számlázási adatok megtekintése
                </Link>
              </div>
            </div>
          </Card>

          {/* Security Section */}
          <Card
            as="section"
            className="bg-gradient-to-br from-bg to-bg-muted"
            header={
              <CardHeader>
                <h2 className="text-h5 font-semibold text-fg">
                  {t('billing.stripeSecurity.title')}
                </h2>
              </CardHeader>
            }
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-2">
                <p className="text-body-small leading-relaxed text-fg-muted">
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

          {/* Subscription Actions - for paid plans */}
          {(plan === 'pro' || plan === 'standard') && (
            <div className="mb-12">
              <div className="bg-bg-muted border-2 border-border rounded-2xl p-8">
                <h3 className="text-h4 font-bold text-fg mb-6">Előfizetés módosítása</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Downgrade to Standard */}
                  {plan === 'pro' && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Biztosan vissza szeretnél lépni a Standard csomagra? A változás a következő számlázási ciklustól lép életbe.',
                          )
                        ) {
                          startCheckout(
                            billingInterval === 'annual'
                              ? STANDARD_PRICE_ANNUAL || STANDARD_PRICE_MONTHLY
                              : STANDARD_PRICE_MONTHLY,
                          );
                        }
                      }}
                      className="flex items-start gap-4 p-5 bg-bg-muted hover:bg-bg border-2 border-border hover:border-primary/30 rounded-xl transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-fg mb-1">Visszalépés Standard-ra</div>
                        <p className="text-body-small text-fg-muted">5 500 Ft/hó megtakarítás</p>
                      </div>
                    </button>
                  )}

                  {/* Pause subscription */}
                  <button
                    onClick={() => {
                      showToast({
                        title: 'Előfizetés szüneteltetése',
                        description: 'Ez a funkció hamarosan elérhető lesz.',
                        variant: 'info',
                      });
                    }}
                    className="flex items-start gap-4 p-5 bg-bg-muted hover:bg-bg border-2 border-border hover:border-warning/30 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pause className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="font-bold text-fg mb-1">Előfizetés szüneteltetése</div>
                      <p className="text-sm text-fg-muted">Ideiglenesen leállítás</p>
                    </div>
                  </button>

                  {/* Cancel subscription */}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          'Biztosan le szeretnéd mondani az előfizetést? A Pro funkciók a következő számlázási ciklus végéig elérhetők maradnak.',
                        )
                      ) {
                        showToast({
                          title: 'Előfizetés lemondása',
                          description:
                            'Ez a funkció hamarosan elérhető lesz. Kérlek vedd fel velünk a kapcsolatot: hello@vyndi.com',
                          variant: 'info',
                        });
                      }
                    }}
                    className="flex items-start gap-4 p-5 bg-bg-muted hover:bg-danger/10 border-2 border-border hover:border-danger/30 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-danger" />
                    </div>
                    <div>
                      <div className="font-bold text-fg mb-1">Előfizetés lemondása</div>
                      <p className="text-sm text-fg-muted">Véglegesen leállítás</p>
                    </div>
                  </button>
                </div>

                <p className="text-caption text-fg-muted mt-4 text-center">
                  Bármilyen módosítás után a jelenlegi számlázási időszak végéig (
                  {resetDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })})
                  továbbra is elérheted a {plan === 'pro' ? 'Pro' : 'Standard'} funkciókat
                </p>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="rounded-2xl border border-border/60 bg-white/50 p-6">
            <p className="text-sm text-fg-muted">
              {t('billing.account.emailLabel')}{' '}
              <span className="font-semibold text-fg">{email ?? '—'}</span>
              {hasUnlimitedEmail && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-caption font-semibold text-success">
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
    </div>
  );
}

function PublicBillingLanding() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // Scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('compare');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Pricing - use constants from above
  const standardMonthly = MONTHLY_PRICES.standard;
  const proMonthly = MONTHLY_PRICES.pro;

  return (
    <main id="main" className="flex flex-col pb-24">
      {/* Enhanced Hero Section with Urgency & Value Proposition */}
      <section className="py-20 lg:py-32 bg-gradient-hero text-white relative overflow-hidden min-h-screen flex flex-col -mt-14 md:-mt-20">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center w-full">
            {/* Limited time badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white px-5 py-2 rounded-full mb-6 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-body-small">
                🎉 Különleges ajánlat: 30% kedvezmény az első 3 hónapra
              </span>
            </div>

            <H1 className="mb-6" fluid>
              Készíts{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
                3x gyorsabban
              </span>{' '}
              professzionális ajánlatokat
            </H1>

            <p className="text-h6 text-white/80 mb-8 max-w-3xl mx-auto leading-typography-relaxed text-pretty">
              Már több mint 200 vállalkozás használja a Vyndit márkahű ajánlatok készítésére.
              Indítsd el ingyen — nincs bankkártya, nincs kockázat.
            </p>

            {/* Social proof numbers */}
            <div className="flex items-center justify-center gap-8 mb-8 text-white flex-wrap">
              <div>
                <div className="text-h2 font-bold text-primary">10K+</div>
                <div className="text-white/70 text-body-small">Ajánlat készült</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-h2 font-bold text-primary">150K+</div>
                <div className="text-white/70 text-body-small">Sor generált tartalom</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div>
                <div className="text-h2 font-bold text-primary">4.9★</div>
                <div className="text-white/70 text-body-small">Átlagos értékelés</div>
              </div>
            </div>

            {/* Primary CTA with 3 features */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <Link
                href="/login?redirect=/new"
                className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-body md:text-h5 text-white">
                  Kezdd el ingyen
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Kezdd el teljesen ingyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Nem kérünk bankkártyát</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Kész ajánlat 5 perc alatt</span>
                </div>
              </div>

              {/* Scroll indicator - moved to bottom */}
              <div className="flex flex-col items-center gap-2 animate-bounce mt-auto pt-8">
                <button
                  onClick={scrollToPricing}
                  className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-2 group"
                  aria-label="Scroll to pricing"
                >
                  <span className="text-body-small font-medium">💰 Nézd meg az árakat</span>
                  <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                </button>
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
              <h2 className="text-h1 md:text-display font-bold text-navy-900 mb-4 text-balance">
                Válassz csomagot
              </h2>
              <p className="text-h6 text-fg-muted max-w-2xl mx-auto text-pretty leading-typography-relaxed">
                Minden csomag 30 napos pénzvisszafizetési garanciával
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 items-center max-w-7xl mx-auto mt-16">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-300 transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-h3 font-bold text-fg mb-2">Ingyenes</h3>
                  <p className="text-fg-muted text-body-small mb-6">
                    Kezdd el kockázat nélkül — ideális az első ajánlatokhoz
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-display font-bold text-fg">0 Ft</span>
                    </div>
                    <p className="text-fg-muted text-body-small mt-2">Örökre ingyenes</p>
                  </div>

                  <Link
                    href="/login?redirect=/new"
                    className="w-full bg-bg-muted text-fg-muted py-3 rounded-xl font-semibold hover:bg-bg transition-colors text-center min-h-[44px] flex items-center justify-center"
                  >
                    Kezdd el ingyen
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">2 ajánlat / hónap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Alap sablon</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">PDF-export</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">
                      Korlátozott branding (színek)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Tevékenység sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Email támogatás</span>
                  </div>
                </div>
              </div>

              {/* Standard Plan */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-300 transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-h3 font-bold text-fg mb-2">Vyndi Standard</h3>
                  <p className="text-fg-muted text-body-small mb-6">
                    A legjobb választás kisvállalkozásoknak, akik rendszeresen készítenek
                    ajánlatokat
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-display font-bold text-fg">
                        {standardMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-fg-muted text-h5">Ft/hó</span>
                    </div>
                    <p className="text-fg-muted text-body-small mt-2">Havi számlázás</p>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-bg-muted text-fg-muted py-3 rounded-xl font-semibold hover:bg-bg transition-colors text-center min-h-[44px] flex items-center justify-center"
                  >
                    Frissítés Standardra
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">5 ajánlat / hónap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Alap sablon</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">PDF-export</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">
                      Korlátozott branding (színek)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Tevékenység sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-fg-muted flex-shrink-0 mt-0.5" />
                    <span className="text-fg-muted text-body-small">Email támogatás</span>
                  </div>
                </div>
              </div>

              {/* Pro Plan - RECOMMENDED */}
              <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 shadow-2xl transform lg:scale-110 border-4 border-primary/60 h-full flex flex-col">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-warning to-warning/80 text-fg px-6 py-2 rounded-full font-bold text-body-small shadow-lg flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>LEGNÉPSZERŰBB</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-h3 font-bold text-primary-ink mb-2">Vyndi Pro</h3>
                  <p className="text-primary-ink/90 text-body-small mb-6">
                    Haladó funkciók csapatoknak és ügynökségeknek
                  </p>

                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-display font-bold text-primary-ink">
                        {proMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-primary-ink/90 text-h5">Ft/hó</span>
                    </div>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-bg-muted text-primary py-4 rounded-xl font-bold text-h5 hover:shadow-2xl hover:scale-105 transition-all text-center min-h-[44px] flex items-center justify-center"
                  >
                    Pro előfizetés indítása
                  </Link>

                  {/* Social proof */}
                  <p className="text-primary-ink/80 text-caption text-center mt-3">
                    ⭐ 500+ elégedett ügyfél
                  </p>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Korlátlan ajánlat
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Online megosztás elfogadással & PDF-export
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Teljes branding (színek és logó)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Tevékenység sablonok referenciafotókkal
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Ajánlások integrálása az ajánlatokba
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Csapattag hozzáadása
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-primary-ink text-body-small font-medium">
                      Prioritásos ügyfélszolgálat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Enterprise Section */}
      <section className="py-16 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full font-semibold text-body-small mb-6 border border-primary/30">
                  <Building2 className="w-4 h-4" />
                  Vállalatoknak
                </div>
                <h2 className="text-h1 md:text-display font-bold mb-6 leading-typography-tight text-balance">
                  Nagyobb csapatban dolgoztok? Egyedi igényeitek vannak?
                </h2>
                <p className="text-h6 text-white/80 mb-8 leading-typography-relaxed text-pretty">
                  Kérj személyre szabott ajánlatot a Vyndi Business csomagra.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    'Korlátlan csapattag',
                    'Dedikált támogatás',
                    'Haladó riportok',
                    'Egyedi sablonok',
                    'Egyedi integráció vállalati rendszerekkel',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary"
                        strokeWidth={3}
                      />
                      <span className="text-h5 text-white/90 text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="mailto:info@vyndi.com?subject=Enterprise megoldás érdeklődés"
                    className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-ink font-bold px-8 py-4 rounded-xl text-h5 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 min-h-[44px]"
                  >
                    Lépj kapcsolatba velünk
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="bg-gradient-to-br from-turquoise-500/20 to-blue-500/20 rounded-3xl p-8 border border-turquoise-500/30 backdrop-blur">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/30 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/30 rounded-2xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-accent/30 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-accent" />
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

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-h1 md:text-display font-bold text-navy-900 mb-4 text-balance">
                Hasonlítsd össze a Vyndi csomagokat
              </h2>
              <p className="text-h5 text-fg-muted text-pretty">
                Válaszd ki a vállalkozásodhoz legjobbat
              </p>
            </div>

            {/* Enhanced Comparison Table */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-navy-900 to-navy-800 text-white">
                      <th className="px-8 py-5 text-left font-bold text-h5">Funkció</th>
                      <th className="px-8 py-5 text-center font-bold">Ingyenes</th>
                      <th className="px-8 py-5 text-center font-bold bg-primary/30">Standard</th>
                      <th className="px-8 py-5 text-center font-bold bg-primary">
                        Pro <Star className="inline w-5 h-5 ml-1" fill="currentColor" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(
                      [
                        {
                          feature: 'Ajánlatok / hó',
                          free: '2',
                          standard: '5',
                          pro: 'Korlátlan',
                          type: 'text' as const,
                        },
                        {
                          feature: 'Megosztás',
                          free: 'PDF',
                          standard: 'PDF',
                          pro: 'Link & PDF',
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
                          free: '1',
                          standard: '1',
                          pro: '10+',
                          type: 'text' as const,
                        },
                        {
                          feature: 'Egyedi branding',
                          free: 'Részleges',
                          standard: 'Részleges',
                          standardGray: true,
                          pro: true,
                          type: 'check' as const,
                        },
                        {
                          feature: 'Referenciafotók',
                          free: false,
                          standard: false,
                          pro: true,
                          type: 'check' as const,
                        },
                        {
                          feature: 'Ajánlások integrálása',
                          free: false,
                          standard: false,
                          pro: true,
                          type: 'check' as const,
                        },
                        {
                          feature: 'Támogatás',
                          free: 'E-mail',
                          standard: 'E-mail',
                          pro: 'Kiemelt',
                          type: 'text' as const,
                        },
                        {
                          feature: 'Csapat együttműködés',
                          free: false,
                          standard: false,
                          pro: true,
                          type: 'check' as const,
                        },
                      ] as Array<{
                        feature: string;
                        free: string | boolean;
                        standard: string | boolean;
                        standardGray?: boolean;
                        pro: string | boolean;
                        type: 'text' | 'check';
                      }>
                    ).map((row, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-bg">
                        <td className="px-8 py-5 font-semibold text-navy-900">{row.feature}</td>
                        <td className="px-8 py-5 text-center">
                          {row.type === 'check' ? (
                            typeof row.free === 'boolean' ? (
                              row.free === true ? (
                                <div className="flex justify-center">
                                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <X className="w-6 h-6 text-fg-muted" />
                                </div>
                              )
                            ) : (
                              <span className="text-fg-muted font-medium">{row.free}</span>
                            )
                          ) : (
                            <span className="text-fg-muted font-medium">{row.free}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center bg-primary/10">
                          {row.type === 'check' ? (
                            typeof row.standard === 'boolean' ? (
                              row.standard === true ? (
                                <div className="flex justify-center">
                                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <X className="w-6 h-6 text-fg-muted" />
                                </div>
                              )
                            ) : row.standardGray ? (
                              <span className="text-fg-muted/60 font-medium">{row.standard}</span>
                            ) : (
                              <span className="text-fg-muted font-medium">{row.standard}</span>
                            )
                          ) : (
                            <span className="text-fg-muted font-medium">{row.standard}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center bg-primary/20">
                          {row.type === 'check' ? (
                            row.pro === true ? (
                              <div className="flex justify-center">
                                <div className="w-7 h-7 bg-primary/30 rounded-full flex items-center justify-center">
                                  <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <X className="w-6 h-6 text-fg-muted" />
                              </div>
                            )
                          ) : (
                            <span className="text-fg font-bold">{row.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile hint */}
              <div className="lg:hidden px-6 py-4 bg-bg-muted text-center text-body-small text-fg-muted border-t border-border">
                ← Görgess vízszintesen a teljes táblázatért →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-bg-muted to-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-h1 md:text-display font-bold text-navy-900 mb-4 text-balance">
                Mit mondanak a Vyndiről a felhasználóink?
              </h2>
              <p className="text-h5 text-fg-muted text-pretty">
                Több mint 200 elégedett vállalkozás készít gyorsabban és professzionálisabban
                ajánlatokat a Vyndivel.
              </p>
            </div>

            {/* Enhanced testimonials with specific metrics */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial with specific results */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>

                {/* Specific metric callout */}
                <div className="bg-bg-muted rounded-xl p-4 mb-4 border border-primary/20 text-center">
                  <div className="text-h2 font-bold text-primary mb-1">+75%</div>
                  <div className="text-body-small text-fg-muted">több elfogadott ajánlat</div>
                </div>

                <p className="text-fg mb-6 leading-relaxed text-pretty text-center">
                  &ldquo;A Vyndi segítségével 3 hónap alatt 75%-kal nőtt az ajánlataink elfogadási
                  aránya. Az AI funkció hihetetlen időt spórol meg nekünk.&rdquo;
                </p>

                <div className="flex items-center justify-center gap-4">
                  <Image
                    src={TESTIMONIALS[0].image}
                    alt={TESTIMONIALS[0].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-bg-muted shadow-md object-cover"
                  />
                  <div className="text-center">
                    <div className="font-bold text-fg">{TESTIMONIALS[0].author}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[0].role}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[0].company}</div>
                  </div>
                </div>

                {/* Verification badge */}
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-2 text-primary text-body-small">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with time saved */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>

                <div className="bg-bg-muted rounded-xl p-4 mb-4 border border-primary/30 text-center">
                  <div className="text-h2 font-bold text-primary mb-1">15 óra</div>
                  <div className="text-body-small text-fg-muted">megtakarítás hetente</div>
                </div>

                <p className="text-fg-muted mb-6 leading-relaxed text-pretty text-center">
                  &ldquo;Korábban 2-3 napig tartott egy ajánlat elkészítése. Most 30 perc alatt kész
                  vagyok, és még profibb is lett az eredmény.&rdquo;
                </p>

                <div className="flex items-center justify-center gap-4">
                  <Image
                    src={TESTIMONIALS[1].image}
                    alt={TESTIMONIALS[1].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div className="text-center">
                    <div className="font-bold text-fg">{TESTIMONIALS[1].author}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[1].role}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[1].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/30">
                  <div className="flex items-center justify-center gap-2 text-primary text-body-small">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with ROI */}
              <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl p-8 border-2 border-warning/30">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-warning fill-warning" />
                  ))}
                </div>

                <div className="bg-bg-muted rounded-xl p-4 mb-4 border border-warning/30 text-center">
                  <div className="text-h2 font-bold text-warning mb-1">5M Ft</div>
                  <div className="text-body-small text-fg-muted">új bevétel ajánlatokból</div>
                </div>

                <p className="text-fg-muted mb-6 leading-relaxed text-pretty text-center">
                  &ldquo;A professzionális ajánlatok segítségével több nagy ügyfelet tudtunk
                  megnyerni. A befektetés megtérült már az első hónapban.&rdquo;
                </p>

                <div className="flex items-center justify-center gap-4">
                  <Image
                    src={TESTIMONIALS[2].image}
                    alt={TESTIMONIALS[2].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div className="text-center">
                    <div className="font-bold text-fg">{TESTIMONIALS[2].author}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[2].role}</div>
                    <div className="text-body-small text-fg-muted">{TESTIMONIALS[2].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-center gap-2 text-warning text-body-small">
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
              <h2 className="text-h1 md:text-display font-bold text-navy-900 mb-4 text-balance">
                Gyakori kérdések az árazásról és a csomagokról
              </h2>
            </div>

            {/* Enhanced accordion with highlighted money-back guarantee */}
            <div className="space-y-4">
              {/* High-priority FAQ - Money-back guarantee highlighted */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(0)}
                  className="w-full flex items-center justify-between p-6 hover:bg-bg-muted/50 transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-ink" />
                    </div>
                    <span className="font-bold text-fg text-left text-h5">
                      Van pénz-visszafizetési garancia?
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-fg-muted transition-transform ${
                      openFAQ === 0 ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFAQ === 0 && (
                  <div className="px-6 pb-6">
                    <p className="text-fg leading-relaxed mb-4">
                      Igen. A fizetős csomagokra 30 napos pénz-visszafizetési garancia vonatkozik.
                    </p>
                    <p className="text-fg leading-relaxed">
                      Ha nem vagy elégedett, kérdés nélkül visszatérítjük a díjat.
                    </p>
                  </div>
                )}
              </div>

              {/* Standard FAQs */}
              {PRICING_FAQS.map((faq, idx) => {
                // Skip the money-back FAQ as we have it highlighted above
                if (idx === 3) return null;

                return (
                  <div
                    key={idx}
                    className="bg-bg-muted rounded-xl border-2 border-border overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <button
                      onClick={() => toggleFAQ(idx + 1)}
                      className="w-full flex items-center justify-between p-6 hover:bg-bg transition-colors min-h-[44px]"
                    >
                      <span className="font-bold text-fg text-left">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-fg-muted transition-transform ${
                          openFAQ === idx + 1 ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFAQ === idx + 1 && (
                      <div className="px-6 pb-6 border-t border-border pt-6">
                        <div className="text-fg leading-relaxed text-pretty whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Still have questions CTA */}
            <div className="mt-12 text-center bg-bg rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-h4 font-bold text-fg mb-2">Még maradt kérdésed?</h3>
              <p className="text-fg-muted mb-6">
                Írj nekünk bátran — segítünk kiválasztani a vállalkozásodhoz legjobban illő
                csomagot.
              </p>
              <Link
                href="mailto:hello@vyndi.com"
                className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors inline-flex items-center gap-2 min-h-[44px]"
              >
                Kapcsolatfelvétel
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                {
                  icon: Shield,
                  title: 'Biztonságos infrastruktúra',
                  description: 'EU adatközpontok, rendszeres mentések',
                },
                {
                  icon: Award,
                  title: 'Adatvédelmi megfelelés',
                  description: 'GDPR-kompatibilis adatkezelés',
                },
                {
                  icon: Lock,
                  title: '99.9% elérhető',
                  description: 'Magas rendelkezésre állás',
                },
                {
                  icon: TrendingUp,
                  title: 'Folyamatos fejlesztés',
                  description: 'Rendszeres új funkciók és frissítések',
                },
              ].map((benefit, idx) => (
                <div key={idx} className="text-center group cursor-default">
                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-turquoise-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all">
                    <benefit.icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-navy-900 text-h5 mb-2 group-hover:text-turquoise-600 transition-colors">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-fg-muted text-body-small leading-relaxed text-pretty">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
