'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';
import { envClient } from '@/env.client';
import AppFrame from '@/components/AppFrame';

const STARTER_PRICE = envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const PRO_PRICE = envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const CHECKOUT_API_PATH = '/api/stripe/checkout';

export default function BillingPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStatus(params.get('status') || null);

    (async () => {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      setEmail(user?.email ?? null);
    })();
  }, []);

  async function startCheckout(priceId: string) {
    try {
      setLoading(priceId);
      const resp = await fetch(CHECKOUT_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ priceId, email })
      });
      if (!resp.ok) {
        let message = 'Nem sikerült elindítani a fizetést.';
        try {
          const payload: unknown = await resp.json();
          if (payload && typeof payload === 'object' && 'error' in payload) {
            const errorValue = (payload as { error?: unknown }).error;
            if (typeof errorValue === 'string' && errorValue.trim()) {
              message = errorValue;
            }
          }
        } catch {
          // ignore JSON parse errors
        }
        alert(message);
        setLoading(null);
        return;
      }
      const { url } = await resp.json();
      if (url) window.location.href = url;
      else setLoading(null);
    } catch (e) {
      console.error(e);
      alert('Váratlan hiba a fizetés indításakor.');
      setLoading(null);
    }
  }

  return (
    <AppFrame
      title="Előfizetés"
      description="Válaszd ki a csomagot, és biztonságosan, a Stripe felületén keresztül intézd a fizetést."
    >
      <div className="space-y-8">
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
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Propono Start</h2>
            <p className="mt-3 text-sm text-slate-500">
              5 automatikusan generált, professzionális AI-ajánlat havonta. Letisztult PDF és tételes árkalkuláció kis csapatoknak.
            </p>
            <div className="mt-6 flex items-baseline gap-2 text-slate-900">
              <span className="text-3xl font-semibold">1 490</span>
              <span className="text-sm text-slate-500">Ft / hó</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
              <li>• 5 ajánlat / hónap</li>
              <li>• PDF export</li>
              <li>• Alap sablonok és logófeltöltés</li>
            </ul>
            <button
              onClick={() => startCheckout(STARTER_PRICE)}
              disabled={loading === STARTER_PRICE}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading === STARTER_PRICE ? 'Átirányítás…' : 'Propono Start megrendelése'}
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

        <p className="text-sm text-slate-500">Bejelentkezett e-mail: <span className="font-medium text-slate-700">{email ?? '—'}</span></p>
      </div>
    </AppFrame>
  );
}
