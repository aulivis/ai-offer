'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

const STARTER_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!;
const PRO_PRICE = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;

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
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ priceId, email })
      });
      if (!resp.ok) {
        const j = await resp.json().catch(()=> ({} as any));
        alert(j.error || 'Nem sikerült elindítani a fizetést.');
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold">Propono előfizetés</h1>
        <p className="text-gray-600 mt-2">
          Válaszd ki a csomagot. A fizetés biztonságosan, a Stripe felületén történik.
        </p>

        {status === 'success' && (
          <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-800">
            Sikeres fizetés! A csomagod hamarosan frissül.
          </div>
        )}
        {status === 'cancel' && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-100 text-yellow-800">
            A fizetést megszakítottad. Próbáld újra, ha készen állsz.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Propono Start */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Belépő csomag</div>
            <h2 className="text-2xl font-semibold mt-1">Propono Start</h2>
            <p className="text-gray-600 mt-2">
              5 automatikusan generált, professzionális AI-ajánlat havonta.
              Letisztult PDF, tételes árkalkuláció.
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold">1 490</span>{' '}
              <span className="text-base text-gray-600">Ft / hó</span>
            </div>
            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              <li>• 5 ajánlat / hónap</li>
              <li>• PDF export</li>
              <li>• Alap sablonok</li>
            </ul>
            <button
              onClick={() => startCheckout(STARTER_PRICE)}
              disabled={loading === STARTER_PRICE}
              className="mt-6 w-full rounded-lg bg-black text-white py-2"
            >
              {loading === STARTER_PRICE ? 'Átirányítás…' : 'Propono Start megrendelése'}
            </button>
          </div>

          {/* Propono Pro */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm ring-2 ring-black/5">
            <div className="text-sm font-medium text-purple-600">Népszerű</div>
            <h2 className="text-2xl font-semibold mt-1">Propono Pro</h2>
            <p className="text-gray-600 mt-2">
              Korlátlan ajánlatgenerálás, márkázott PDF, fejlett sablonok és prioritásos támogatás.
              Ügynökségeknek és növekvő csapatoknak.
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold">6 990</span>{' '}
              <span className="text-base text-gray-600">Ft / hó</span>
            </div>
            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              <li>• Korlátlan ajánlat</li>
              <li>• Márkázott PDF & sablonkönyvtár</li>
              <li>• Prioritásos AI-szövegírási beállítások</li>
            </ul>
            <button
              onClick={() => startCheckout(PRO_PRICE)}
              disabled={loading === PRO_PRICE}
              className="mt-6 w-full rounded-lg bg-black text-white py-2"
            >
              {loading === PRO_PRICE ? 'Átirányítás…' : 'Propono Pro megrendelése'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Bejelentkezett e-mail: {email ?? '—'}
        </div>
      </div>
    </div>
  );
}
