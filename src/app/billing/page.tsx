'use client';

import { t, type CopyKey } from '@/copy';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientLogger } from '@/lib/clientLogger';
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
import { useSupabase } from '@/components/SupabaseProvider';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { ButtonProps } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ToastProvider';
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

const STANDARD_PRICE_MONTHLY = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const PRO_PRICE_MONTHLY = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const STANDARD_PRICE_ANNUAL = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL;
const PRO_PRICE_ANNUAL = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL;
const CHECKOUT_API_PATH = '/api/stripe/checkout';

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

      {/* Downgrade Badge - Previous Plan */}
      {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
        <div className="absolute top-6 right-6">
          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-bold">
            Korábbi csomag
          </span>
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

        {/* Downgrade Warning - Enhanced for Pro users viewing Standard */}
        {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
          <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Visszalépés esetén elveszíted:</p>
                <ul className="space-y-1 text-xs">
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
        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{data.price}</span>
            <span className="text-sm font-medium text-slate-500">
              {billingInterval === 'annual' ? 'Ft/év' : 'Ft/hó'}
            </span>
          </div>

          {/* Annual billing: show effective monthly price and savings */}
          {billingInterval === 'annual' && savings && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                Effektíve {formatPrice(effectiveMonthlyPrice)} Ft/hó
              </p>
              <p className="text-xs font-semibold text-teal-600">
                {formatPrice(savings.totalSavings)} Ft megtakarítás/év ({savings.percentageSaved}%)
              </p>
            </div>
          )}

          {/* Monthly billing: show per month */}
          {billingInterval === 'monthly' && (
            <p className="mt-1 text-xs text-gray-500">havonta számlázva</p>
          )}
        </div>

        {/* Savings message for downgrade */}
        {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
          <p className="text-sm text-gray-600 mt-2">Visszalépés 5 500 Ft/hó megtakarítás</p>
        )}

        {/* Features List */}
        <ul className="mt-6 flex-1 space-y-3">
          {data.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm text-slate-700">{feature}</span>
            </li>
          ))}

          {/* Show removed features with strikethrough for Pro downgrading to Standard */}
          {isDowngrade && !isCurrent && plan === 'pro' && planType === 'standard' && (
            <>
              <li className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <span className="text-sm text-gray-400 line-through">Korlátlan ajánlatok</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <span className="text-sm text-gray-400 line-through">AI generált szövegek</span>
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
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useOptionalAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'BillingPage' }),
    [user?.id],
  );
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'standard' | 'pro' | null>(null);
  const [usage, setUsage] = useState<{
    offersGenerated: number;
    periodStart: string | null;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

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
        logger.error('Failed to load billing information', error);
        setIsLoadingData(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      logger.error('Failed to start checkout', e, { priceId, email });
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
          className="flex min-h-[60vh] items-center justify-center px-6 pb-20 pt-24 text-sm font-medium text-fg-muted"
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
                <p className="text-sm font-medium text-emerald-800">
                  {t('billing.status.success')}
                </p>
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
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('billing.currentPlan.title')}
                </h2>
                <p className="text-gray-600">{t('billing.currentPlan.subtitle')}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Usage - Most important, make it prominent */}
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-90">
                      Havi használat
                    </div>
                  </div>
                  <div className="text-5xl font-bold mb-2">{offersThisMonth}</div>
                  <div className="text-sm opacity-90 mb-4">ajánlat készítve ebben a hónapban</div>

                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm mb-2">
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
                              ? 'bg-red-300'
                              : usageProgress.isWarning
                                ? 'bg-yellow-300'
                                : 'bg-white'
                          }`}
                          style={{ width: `${Math.min(usageProgress.percentage, 100)}%` }}
                        ></div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card 2: Unlimited quota explanation or remaining */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-teal-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                      {planLimit === null ? (
                        <Infinity className="w-5 h-5 text-teal-600" />
                      ) : (
                        <svg
                          className="w-5 h-5 text-teal-600"
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
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-600">
                      {planLimit === null
                        ? 'Felhasználási keret'
                        : t('billing.currentPlan.remaining.title')}
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {planLimit === null ? 'Korlátlan' : remainingQuotaLabel}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {planLimit === null
                      ? 'Ajánlatok készítése'
                      : t('billing.currentPlan.remaining.helper')}
                  </div>

                  {planLimit === null && (
                    <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 px-3 py-2 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-semibold">Pro előny</span>
                    </div>
                  )}
                </div>

                {/* Card 3: Next billing date with countdown */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-600">
                      Következő fizetés
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {resetDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">{resetLabel}</div>

                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = resetDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        {diffDays > 0 ? `${diffDays} nap múlva` : 'Ma'} • Automatikus megújulás
                      </div>
                    );
                  })()}
                </div>

                {/* Card 4: Payment amount */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-600">
                      Havi díjszabás
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan === 'pro' ? '6 990' : plan === 'standard' ? '1 490' : '0'} Ft
                  </div>
                  <div className="text-sm text-gray-600 mb-4">havonta számlázva</div>

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
                      className="text-sm text-teal-600 font-semibold hover:underline flex items-center gap-1"
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">A Vyndi Pro előnyei</h3>
                <p className="text-gray-600">Nézd meg, mit kapsz a Pro csomagban</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-6 border-2 border-teal-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Infinity className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Korlátlan ajánlatok</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Készíts annyi ajánlatot, amennyit csak szeretnél. Nincs havi limit.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-teal-700">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">AI szövegírás</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Generálj professzionális ajánlatszövegeket mesterséges intelligenciával.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Prémium sablonok</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Hozzáférés 15+ exkluzív, professzionális ajánlat sablonhoz.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-orange-700">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Prioritásos support</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    1 órán belüli válaszidő minden kérdésedre és problémádra.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">PDF export márkázással</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Töltsd le ajánlataidat professzionális PDF formátumban, saját logóval.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold">Aktív előnyöd</span>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Haladó elemzések</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Részletes statisztikák az ajánlataidról és az ügyfél interakciókról.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
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
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('billing.comparison.title')}
                  </h2>
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
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                      <td className="py-4 text-center">
                        <Check className="mx-auto h-5 w-5 text-primary" />
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
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-slate-50/50">
                      <td className="py-4 font-medium text-slate-700">
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
              <h2 className="text-xl font-bold text-slate-900">Válassz csomagot</h2>
              <p className="mt-1 text-sm text-slate-600">
                Válaszd ki a számodra megfelelő előfizetést
              </p>

              {/* Billing Interval Toggle */}
              {STANDARD_PRICE_ANNUAL || PRO_PRICE_ANNUAL ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                      billingInterval === 'monthly'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Havi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('annual')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all relative ${
                      billingInterval === 'annual'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Éves
                    {billingInterval === 'annual' && (
                      <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Előfizetés kezelése</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment method card */}
                <Card className="border-2 border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-6 h-6 text-gray-900" />
                      <h4 className="text-lg font-bold text-gray-900">Fizetési mód</h4>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Nincs mentett kártya</div>
                        <div className="text-sm text-gray-600">
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
                      <Calendar className="w-6 h-6 text-gray-900" />
                      <h4 className="text-lg font-bold text-gray-900">Számlázási gyakoriság</h4>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Havi fizetés</div>
                        <div className="text-sm text-gray-600">
                          {plan === 'pro' ? '6 990' : '1 490'} Ft / hónap
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">
                        Aktív
                      </span>
                    </div>

                    {plan === 'pro' && (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <TrendingDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-900 mb-1">
                              Takarítsd meg 13 980 Ft-ot évente!
                            </p>
                            <p className="text-xs text-green-700">
                              Éves fizetéssel 2 hónap ingyen: 6 290 Ft/hó (75 480 Ft/év)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                      onClick={() => {
                        showToast({
                          title: 'Éves fizetésre váltás',
                          description: 'Ez a funkció hamarosan elérhető lesz.',
                          variant: 'info',
                        });
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
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('billing.invoices.title')}
                  </h2>
                  <p className="text-xs text-slate-500">{t('billing.invoices.subtitle')}</p>
                </div>
              </CardHeader>
            }
          >
            <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100">
              {/* Icon */}
              <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-10 h-10 text-teal-600" />
              </div>

              {/* Message */}
              <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {t('billing.invoices.emptyState.title')}
              </h4>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-center">
                Az első számlád automatikusan generálódik a következő fizetési időpontban
              </p>

              {/* Next invoice info card */}
              {(plan === 'pro' || plan === 'standard') && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 max-w-lg mx-auto mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 mb-3">Következő számla</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Dátum:</span>
                          <span className="font-semibold text-gray-900">{resetLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Összeg:</span>
                          <span className="font-semibold text-gray-900">
                            {plan === 'pro' ? '6 990' : '1 490'} Ft
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Formátum:</span>
                          <span className="font-semibold text-gray-900">PDF letöltés</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold text-gray-900">Automatikus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info about billing address */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  A számlázási adataid a Beállítások → Cégadatok menüpontban módosíthatók
                </p>
                <Link
                  href="/settings"
                  className="text-teal-600 font-semibold hover:underline flex items-center gap-2 mx-auto justify-center"
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

          {/* Subscription Actions - for paid plans */}
          {(plan === 'pro' || plan === 'standard') && (
            <div className="mb-12">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Előfizetés módosítása</h3>

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
                      className="flex items-start gap-4 p-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 mb-1">Visszalépés Standard-ra</div>
                        <p className="text-sm text-gray-600">5 500 Ft/hó megtakarítás</p>
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
                    className="flex items-start gap-4 p-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pause className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Előfizetés szüneteltetése</div>
                      <p className="text-sm text-gray-600">Ideiglenesen leállítás</p>
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
                    className="flex items-start gap-4 p-5 bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Előfizetés lemondása</div>
                      <p className="text-sm text-gray-600">Véglegesen leállítás</p>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Bármilyen módosítás után a jelenlegi számlázási időszak végéig (
                  {resetDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })})
                  továbbra is elérheted a {plan === 'pro' ? 'Pro' : 'Standard'} funkciókat
                </p>
              </div>
            </div>
          )}

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

  // Pricing
  const standardMonthly = 1490;
  const proMonthly = 6990;

  return (
    <main id="main" className="flex flex-col pb-24">
      {/* Enhanced Hero Section with Urgency & Value Proposition */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 text-white relative overflow-hidden min-h-screen flex flex-col -mt-14 md:-mt-20">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center w-full">
            {/* Limited time badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white px-5 py-2 rounded-full mb-6 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">
                🎉 Különleges ajánlat: 30% kedvezmény az első 3 hónapra
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-balance">
              Készíts{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
                3x gyorsabban
              </span>{' '}
              professzionális ajánlatokat
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed text-pretty">
              Már több mint 200 vállalkozás használja a Vyndit márkahű ajánlatok készítésére.
              Indítsd el ingyen — nincs bankkártya, nincs kockázat.
            </p>

            {/* Social proof numbers */}
            <div className="flex items-center justify-center gap-8 mb-8 text-white flex-wrap">
              <div>
                <div className="text-3xl font-bold text-teal-400">10K+</div>
                <div className="text-gray-300 text-sm">Ajánlat készült</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div>
                <div className="text-3xl font-bold text-teal-400">150K+</div>
                <div className="text-gray-300 text-sm">Sor generált tartalom</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div>
                <div className="text-3xl font-bold text-teal-400">4.9★</div>
                <div className="text-gray-300 text-sm">Átlagos értékelés</div>
              </div>
            </div>

            {/* Primary CTA with 3 features */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <Link
                href="/login?redirect=/new"
                className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-base md:text-lg text-white">
                  Kezdd el ingyen
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

              {/* Scroll indicator - moved to bottom */}
              <div className="flex flex-col items-center gap-2 animate-bounce mt-auto pt-8">
                <button
                  onClick={scrollToPricing}
                  className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-2 group"
                  aria-label="Scroll to pricing"
                >
                  <span className="text-sm font-medium">💰 Nézd meg az árakat</span>
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
                  <p className="text-gray-600 text-sm mb-6">
                    Kezdd el kockázat nélkül — ideális az első ajánlatokhoz
                  </p>

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
                    <span className="text-gray-700 text-sm">2 ajánlat / hónap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Alap sablon</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">PDF-export</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Korlátozott branding (színek)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Tevékenység sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Email támogatás</span>
                  </div>
                </div>
              </div>

              {/* Standard Plan */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-gray-300 transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Vyndi Standard</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    A legjobb választás kisvállalkozásoknak, akik rendszeresen készítenek
                    ajánlatokat
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        {standardMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-gray-600 text-lg">Ft/hó</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">Havi számlázás</p>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center min-h-[44px] flex items-center justify-center"
                  >
                    Frissítés Standardra
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">10 ajánlat / hónap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Alap sablon</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">PDF-export</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Korlátozott branding (színek)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Tevékenység sablonok</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Email támogatás</span>
                  </div>
                </div>
              </div>

              {/* Pro Plan - RECOMMENDED */}
              <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-8 shadow-2xl transform lg:scale-110 border-4 border-teal-400 h-full flex flex-col">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    <span>LEGNÉPSZERŰBB</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Vyndi Pro</h3>
                  <p className="text-teal-100 text-sm mb-6">
                    Haladó funkciók csapatoknak és ügynökségeknek
                  </p>

                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        {proMonthly.toLocaleString('hu-HU')}
                      </span>
                      <span className="text-teal-100 text-lg">Ft/hó</span>
                    </div>
                  </div>

                  <Link
                    href="/login?redirect=/billing"
                    className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all text-center min-h-[44px] flex items-center justify-center"
                  >
                    Pro előfizetés indítása
                  </Link>

                  {/* Social proof */}
                  <p className="text-teal-100 text-xs text-center mt-3">⭐ 500+ elégedett ügyfél</p>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Korlátlan ajánlat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">
                      Online megosztás elfogadással & PDF-export
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">
                      Teljes branding (színek és logó)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">
                      Tevékenység sablonok referenciafotókkal
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">
                      Ajánlások integrálása az ajánlatokba
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">Csapattag hozzáadása</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium">
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
                  <Building2 className="w-4 h-4" />
                  Vállalatoknak
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-balance">
                  Nagyobb csapatban dolgoztok? Egyedi igényeitek vannak?
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed text-pretty">
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
                    Lépj kapcsolatba velünk
                    <ArrowRight className="w-5 h-5" />
                  </a>
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

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
                Hasonlítsd össze a Vyndi csomagokat
              </h2>
              <p className="text-xl text-gray-600 text-pretty">
                Válaszd ki a vállalkozásodhoz legjobbat
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
                    {(
                      [
                        {
                          feature: 'Ajánlatok / hó',
                          free: '2',
                          standard: '10',
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
                      <tr key={idx} className="transition-colors hover:bg-gray-50">
                        <td className="px-8 py-5 font-semibold text-navy-900">{row.feature}</td>
                        <td className="px-8 py-5 text-center">
                          {row.type === 'check' ? (
                            typeof row.free === 'boolean' ? (
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
                            )
                          ) : (
                            <span className="text-gray-700 font-medium">{row.free}</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center bg-turquoise-50/20">
                          {row.type === 'check' ? (
                            typeof row.standard === 'boolean' ? (
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
                            ) : row.standardGray ? (
                              <span className="text-gray-400 font-medium">{row.standard}</span>
                            ) : (
                              <span className="text-gray-700 font-medium">{row.standard}</span>
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
                Mit mondanak a Vyndiről a felhasználóink?
              </h2>
              <p className="text-xl text-gray-600 text-pretty">
                Több mint 200 elégedett vállalkozás készít gyorsabban és professzionálisabban
                ajánlatokat a Vyndivel.
              </p>
            </div>

            {/* Enhanced testimonials with specific metrics */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial with specific results */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 border-2 border-teal-200">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Specific metric callout */}
                <div className="bg-white rounded-xl p-4 mb-4 border border-teal-200 text-center">
                  <div className="text-3xl font-bold text-teal-600 mb-1">+75%</div>
                  <div className="text-sm text-gray-600">több elfogadott ajánlat</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty text-center">
                  &ldquo;A Vyndi segítségével 3 hónap alatt 75%-kal nőtt az ajánlataink elfogadási
                  aránya. Az AI funkció hihetetlen időt spórol meg nekünk.&rdquo;
                </p>

                <div className="flex items-center justify-center gap-4">
                  <Image
                    src={TESTIMONIALS[0].image}
                    alt={TESTIMONIALS[0].author}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{TESTIMONIALS[0].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[0].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[0].company}</div>
                  </div>
                </div>

                {/* Verification badge */}
                <div className="mt-4 pt-4 border-t border-teal-200">
                  <div className="flex items-center justify-center gap-2 text-teal-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with time saved */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 mb-4 border border-purple-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">15 óra</div>
                  <div className="text-sm text-gray-600">megtakarítás hetente</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty text-center">
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
                    <div className="font-bold text-gray-900">{TESTIMONIALS[1].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[1].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[1].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="flex items-center justify-center gap-2 text-purple-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ellenőrzött vásárló</span>
                  </div>
                </div>
              </div>

              {/* Testimonial with ROI */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <div className="bg-white rounded-xl p-4 mb-4 border border-orange-200 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">5M Ft</div>
                  <div className="text-sm text-gray-600">új bevétel ajánlatokból</div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed text-pretty text-center">
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
                    <div className="font-bold text-gray-900">{TESTIMONIALS[2].author}</div>
                    <div className="text-sm text-gray-600">{TESTIMONIALS[2].role}</div>
                    <div className="text-sm text-gray-500">{TESTIMONIALS[2].company}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-center gap-2 text-orange-600 text-sm">
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
                Gyakori kérdések az árazásról és a csomagokról
              </h2>
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
                      Igen. A fizetős csomagokra 30 napos pénz-visszafizetési garancia vonatkozik.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
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
                        <div className="text-gray-700 leading-relaxed text-pretty whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Still have questions CTA */}
            <div className="mt-12 text-center bg-gray-50 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-teal-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Még maradt kérdésed?</h3>
              <p className="text-gray-600 mb-6">
                Írj nekünk bátran — segítünk kiválasztani a vállalkozásodhoz legjobban illő
                csomagot.
              </p>
              <Link
                href="mailto:hello@vyndi.com"
                className="border-2 border-teal-500 text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors inline-flex items-center gap-2 min-h-[44px]"
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
                  title: '99.9% elérhető',
                  description: 'Magas rendelkezésre állás',
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
    </main>
  );
}
