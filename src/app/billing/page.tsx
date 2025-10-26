'use client';

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

const MARKETING_FEATURES = [
  {
    title: 'Egyetlen esztétikus felület',
    description:
      'A Propono témái igazodnak a márkád színeihez, így minden ajánlat magabiztos, prémium hatást kelt.',
  },
  {
    title: 'AI, ami érti a briefet',
    description:
      'A magyar nyelvű AI lépésről lépésre állítja össze a szöveget, az árkalkulációt és a moduláris blokkokat.',
  },
  {
    title: 'Ügyfélközpontú megosztás',
    description:
      'Élő link, interaktív visszajelzések és aláírás – minden egy irányítópulton, automatikus státuszokkal.',
  },
];

const MARKETING_STEPS = [
  {
    title: 'Brief & mood',
    description:
      'Importáld a projekt részleteit vagy illessz be egy e-mailt – az AI azonnal kiemeli a lényeges pontokat.',
  },
  {
    title: 'Moduláris blokkok',
    description:
      'Válaszd ki a sablonjaidat, kérj új AI-szöveget vagy szerkeszd vizuálisan a szekciókat, mint egy dizájn eszközben.',
  },
  {
    title: 'Megosztás & mérés',
    description:
      'Egy kattintással készül a márkázott PDF, közben valós időben látod, mit olvasott el az ügyfél.',
  },
];

const MARKETING_SPOTLIGHT = [
  'Szabadszavas promptok iparági sablonokkal',
  'Drag & drop blokkok, reszponzív layout',
  'Automatikus PDF export és státuszjelentés',
];

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

  const offersThisMonth = usage?.offersGenerated ?? 0;
  const remainingQuota: string =
    planLimit === null
      ? 'Korlátlan'
      : Math.max(planLimit - offersThisMonth, 0).toLocaleString('hu-HU');
  const planLabels: Record<'free' | 'standard' | 'pro', string> = {
    free: 'Ingyenes csomag',
    standard: 'Propono Standard',
    pro: 'Propono Pro',
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
        Betöltés…
      </main>
    );
  }

  if (!isAuthenticated) {
    return <PublicBillingLanding />;
  }

  return (
    <AppFrame
      title="Előfizetés"
      description="Válaszd ki a csomagot, és biztonságosan, a Stripe felületén keresztül intézd a fizetést."
    >
      <div className="space-y-8">
        <Card
          as="section"
          header={
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Aktuális csomag</h2>
                <p className="text-xs text-slate-500">Állapotod és kvótáid havi bontásban.</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-slate-600">
                {plan ? planLabels[plan] : '—'}
              </span>
            </CardHeader>
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Havi keret
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">
                {planLimit === null ? 'Korlátlan' : `${planLimit.toLocaleString('hu-HU')} ajánlat`}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                Automatikus újraindulás minden hónapban.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                E hónapban létrehozva
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">
                {offersThisMonth.toLocaleString('hu-HU')} ajánlat
              </dd>
              <p className="mt-1 text-xs text-slate-500">Az AI generált PDF-ek számát mutatja.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Felhasználható keret
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">
                {remainingQuota}
                {planLimit === null ? '' : ' ajánlat'}
              </dd>
              <p className="mt-1 text-xs text-slate-500">
                Generálások, amelyek még rendelkezésre állnak.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Keret visszaállása
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{resetLabel}</dd>
              <p className="mt-1 text-xs text-slate-500">
                A számláló minden hónap első napján nullázódik.
              </p>
            </div>
          </dl>
        </Card>

        {status === 'success' && (
          <Card className="p-0 border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700">
            Sikeres fizetés! A csomagod néhány percen belül frissül.
          </Card>
        )}
        {status === 'cancel' && (
          <Card className="p-0 border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
            A fizetés megszakadt. Próbáld újra, amikor készen állsz a váltásra.
          </Card>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          <Card as="article" className="flex h-full flex-col">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Belépő csomag
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Propono Standard</h2>
            <p className="mt-3 text-sm text-slate-500">
              10 automatikusan generált, professzionális AI-ajánlat havonta. Letisztult PDF és
              tételes árkalkuláció kis csapatoknak.
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
            <Button
              onClick={() => startCheckout(STANDARD_PRICE)}
              disabled={loading === STANDARD_PRICE}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading === STANDARD_PRICE ? 'Átirányítás…' : 'Propono Standard megrendelése'}
            </Button>
          </Card>

          <Card
            as="article"
            className="flex h-full flex-col bg-white shadow-lg ring-1 ring-slate-900/5"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Népszerű választás
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Propono Pro</h2>
            <p className="mt-3 text-sm text-slate-500">
              Korlátlan ajánlatgenerálás, márkázott PDF-ek, fejlett sablonkönyvtár és prioritásos
              támogatás növekvő csapatoknak.
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
            <Button
              onClick={() => startCheckout(PRO_PRICE)}
              disabled={loading === PRO_PRICE}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading === PRO_PRICE ? 'Átirányítás…' : 'Propono Pro megrendelése'}
            </Button>
          </Card>
        </section>

        <Card
          as="section"
          header={
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-700">Biztonságos Stripe fizetés</h2>
            </CardHeader>
          }
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="text-sm text-slate-500">
                A Stripe banki szintű titkosítással védi az ügyfeleid adatait, és támogatja a vezető
                kártyatársaságokat, így Visa, Mastercard, American Express, Discover, Diners Club,
                JCB és UnionPay kártyákkal is gond nélkül fizethetnek.
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-4"
              aria-label="Támogatott kártyatársaságok"
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
          Bejelentkezett e-mail: <span className="font-medium text-slate-700">{email ?? '—'}</span>
          {hasUnlimitedEmail && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Korlátlan jogosultság
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
            Előfizetés
          </span>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-[-0.1rem] text-[#151035] md:text-5xl">
            Nyisd meg a Propono prémium élményét és zárj több projektet.
          </h1>
          <p className="max-w-[60ch] text-base leading-[1.7] text-fg-muted md:text-lg">
            Fedezd fel, hogyan készíthetsz AI által támogatott, márkázott ajánlatokat percek alatt.
            Válaszd ki a csomagot, és lépj tovább az értékesítés következő szintjére.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login?redirect=/billing"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
            >
              Lépj be és válassz csomagot
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
            >
              Nézd meg a bemutatót
            </Link>
          </div>
          <ul className="space-y-4 text-base text-fg">
            {MARKETING_SPOTLIGHT.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-2 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-fg-muted">{item}</span>
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
              Belépő csomag
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Propono Standard</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              10 automatikus, professzionális ajánlat havonta PDF exporttal és tételes
              árkalkulációval.
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
            <Link
              href="/login?redirect=/billing"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Standard csomag aktiválása
            </Link>
          </Card>

          <Card
            as="article"
            className="flex h-full flex-col bg-white p-6 shadow-lg ring-1 ring-slate-900/5"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Népszerű választás
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Propono Pro</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Korlátlan ajánlatgenerálás, márkázott PDF-ek, fejlett sablonok és prioritásos
              támogatás növekvő csapatoknak.
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
            <Link
              href="/login?redirect=/billing"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Pro csomag aktiválása
            </Link>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-3">
        {MARKETING_FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="group relative overflow-hidden p-8 transition duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop"
          >
            <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition duration-200 ease-out group-hover:scale-125" />
            <h3 className="text-xl font-semibold text-fg">{feature.title}</h3>
            <p className="mt-4 text-base leading-relaxed text-fg-muted">{feature.description}</p>
          </Card>
        ))}
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
        <Card as="section" className="grid gap-12 p-12 md:gap-14 lg:grid-cols-[0.55fr_1fr]">
          <div className="space-y-7">
            <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
              Folyamat vizuálisan
            </span>
            <h2 className="text-3xl font-semibold text-fg">
              Három lépés, ahol a csapatod együtt dolgozik
            </h2>
            <p className="text-base leading-relaxed text-fg-muted">
              A Propono felülete szabad vászonként működik. A blokkokat mozgathatod, kommentelhetsz,
              és a háttérben az AI mindig egységes arculatot tart.
            </p>
          </div>

          <ol className="relative space-y-5 border-l border-border/60 pl-6">
            {MARKETING_STEPS.map((step, index) => (
              <Card as="li" key={step.title} className="relative space-y-2 bg-bg p-5">
                <span className="absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                  {index + 1}
                </span>
                <p className="text-base font-semibold">{step.title}</p>
                <p className="text-base leading-relaxed text-fg-muted">{step.description}</p>
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
                Ajánlatkészítés újrafogalmazva
              </span>
              <h2 className="text-3xl font-semibold text-fg">
                Csatlakozz a vizuális workflow-hoz, és spórolj órákat minden ajánlaton
              </h2>
              <p className="text-base leading-relaxed text-fg-muted">
                Próbáld ki demóban, majd lépj be, hogy azonnal aktiválhasd a Standard vagy Pro
                csomagot.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login?redirect=/billing"
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink shadow-lg transition duration-200 ease-out hover:shadow-pop"
              >
                Belépés és előfizetés
              </Link>
              <Link
                href="/new"
                className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-semibold text-fg transition duration-200 ease-out hover:border-primary hover:text-primary"
              >
                Ingyenes generálás indítása
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
