'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { envClient } from '@/env.client';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ApiError, fetchWithSupabaseAuth } from '@/lib/api';
import { hasUnlimitedAccess, resolveEffectivePlan } from '@/lib/subscription';

type CardBrand = {
  name: string;
  render: () => JSX.Element;
};

const CARD_BRANDS: CardBrand[] = [
  {
    name: 'Visa',
    render: () => (
      <span className="text-lg font-black tracking-[0.35em] text-[#1a1f71]">VISA</span>
    ),
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
        <span aria-hidden className="h-5 w-5 rounded-full bg-gradient-to-br from-[#f15a29] to-[#fbb040]" />
      </div>
    ),
  },
  {
    name: 'Diners Club',
    render: () => (
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-slate-50">
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
  const { status: authStatus, user } = useRequireAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'standard' | 'pro' | null>(null);
  const [usage, setUsage] = useState<{ offersGenerated: number; periodStart: string | null } | null>(null);

  useEffect(() => {
    setStatus(searchParams?.get('status') || null);
  }, [searchParams]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    (async () => {
      const [{ data: profile }, { data: usageRow }] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
        supabase.from('usage_counters').select('offers_generated, period_start').eq('user_id', user.id).maybeSingle(),
      ]);

      if (!active) {
        return;
      }

      const effectivePlan = resolveEffectivePlan(profile?.plan ?? null, user.email ?? null);
      setPlan(effectivePlan);
      setUsage({
        offersGenerated: Number(usageRow?.offers_generated ?? 0),
        periodStart: usageRow?.period_start ?? null,
      });
      setEmail(user.email ?? null);
    })();

    return () => {
      active = false;
    };
  }, [authStatus, supabase, user]);

  async function startCheckout(priceId: string) {
    try {
      setLoading(priceId);
      const resp = await fetchWithSupabaseAuth(CHECKOUT_API_PATH, {
        supabase,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
        authErrorMessage: 'A fizetés indításához először jelentkezz be.',
        defaultErrorMessage: 'Nem sikerült elindítani a fizetést.',
      });
      const { url } = (await resp.json()) as { url?: string | null };
      if (url) router.push(url);
      else setLoading(null);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof ApiError && typeof e.message === 'string' && e.message.trim()
          ? e.message
          : 'Váratlan hiba a fizetés indításakor.';
      alert(message);
      setLoading(null);
    }
  }

  const planLimit = useMemo<number | null>(() => {
    if (plan === 'pro') return null;
    if (plan === 'standard') return 10;
    return 3;
  }, [plan]);

  const hasUnlimitedEmail = hasUnlimitedAccess(email);
  const effectiveLimit = hasUnlimitedEmail ? null : planLimit;

  const offersThisMonth = usage?.offersGenerated ?? 0;
  const remainingQuota = effectiveLimit === null
    ? 'Korlátlan'
    : Math.max(effectiveLimit - offersThisMonth, 0).toLocaleString('hu-HU');
  const planLabels: Record<'free' | 'standard' | 'pro', string> = {
    free: 'Ingyenes csomag',
    standard: 'Propono Standard',
    pro: 'Propono Pro',
  };

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
    [resetDate]
  );

  return (
    <AppFrame
      title="Előfizetés"
      description="Válaszd ki a csomagot, és biztonságosan, a Stripe felületén keresztül intézd a fizetést."
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Aktuális csomag</h2>
              <p className="text-xs text-slate-500">Állapotod és kvótáid havi bontásban.</p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {plan ? planLabels[plan] : '—'}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Havi keret</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">
                {effectiveLimit === null ? 'Korlátlan' : `${effectiveLimit.toLocaleString('hu-HU')} ajánlat`}
              </dd>
              <p className="mt-1 text-xs text-slate-500">Automatikus újraindulás minden hónapban.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">E hónapban létrehozva</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{offersThisMonth.toLocaleString('hu-HU')} ajánlat</dd>
              <p className="mt-1 text-xs text-slate-500">Az AI generált PDF-ek számát mutatja.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Felhasználható keret</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{remainingQuota}{effectiveLimit === null ? '' : ' ajánlat'}</dd>
              <p className="mt-1 text-xs text-slate-500">Generálások, amelyek még rendelkezésre állnak.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keret visszaállása</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{resetLabel}</dd>
              <p className="mt-1 text-xs text-slate-500">A számláló minden hónap első napján nullázódik.</p>
            </div>
          </dl>
        </section>

        {status === 'success' && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700">
            Sikeres fizetés! A csomagod néhány percen belül frissül.
          </div>
        )}
        {status === 'cancel' && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
            A fizetés megszakadt. Próbáld újra, amikor készen állsz a váltásra.
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Belépő csomag</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Propono Standard</h2>
            <p className="mt-3 text-sm text-slate-500">
              10 automatikusan generált, professzionális AI-ajánlat havonta. Letisztult PDF és tételes árkalkuláció kis csapatoknak.
            </p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">1 490</span>
              <span className="text-sm text-slate-500">Ft / hó</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>• 10 ajánlat / hónap</li>
              <li>• PDF export</li>
              <li>• Alap sablonok és logófeltöltés</li>
            </ul>
            <button
              onClick={() => startCheckout(STANDARD_PRICE)}
              disabled={loading === STANDARD_PRICE}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading === STANDARD_PRICE ? 'Átirányítás…' : 'Propono Standard megrendelése'}
            </button>
          </article>

          <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Népszerű választás
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Propono Pro</h2>
            <p className="mt-3 text-sm text-slate-500">
              Korlátlan ajánlatgenerálás, márkázott PDF-ek, fejlett sablonkönyvtár és prioritásos támogatás növekvő csapatoknak.
            </p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">6 990</span>
              <span className="text-sm text-slate-500">Ft / hó</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>• Korlátlan ajánlat & verziókövetés</li>
              <li>• Márkázott PDF & sablonkönyvtár</li>
              <li>• Prioritásos AI-szöveg finomhangolás</li>
            </ul>
            <button
              onClick={() => startCheckout(PRO_PRICE)}
              disabled={loading === PRO_PRICE}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading === PRO_PRICE ? 'Átirányítás…' : 'Propono Pro megrendelése'}
            </button>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-sm font-semibold text-slate-700">Biztonságos Stripe fizetés</h2>
              <p className="text-sm text-slate-500">
                A Stripe banki szintű titkosítással védi az ügyfeleid adatait, és támogatja a vezető kártyatársaságokat,
                így Visa, Mastercard, American Express, Discover, Diners Club, JCB és UnionPay kártyákkal is gond nélkül
                fizethetnek.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4" aria-label="Támogatott kártyatársaságok">
              {CARD_BRANDS.map((brand) => (
                <div key={brand.name} className="flex items-center justify-center" aria-label={brand.name}>
                  {brand.render()}
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="text-sm text-slate-500">
          Bejelentkezett e-mail: <span className="font-medium text-slate-700">{email ?? '—'}</span>
          {hasUnlimitedEmail && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Korlátlan jogosultság</span>}
        </p>
      </div>
    </AppFrame>
  );
}
