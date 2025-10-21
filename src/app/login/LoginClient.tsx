'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagic() {
    setError(null);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setError(message);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.12),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
          <div className="mb-6 space-y-2 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">P</span>
            <h1 className="text-2xl font-semibold text-slate-900">Bejelentkezés</h1>
            <p className="text-sm text-slate-500">Írd be az e-mail címed, és küldünk egy egyszer használatos belépési linket.</p>
          </div>

          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              E-mail cím
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                type="email"
                placeholder="email@cimed.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              onClick={sendMagic}
              className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!email || sent}
            >
              {sent ? 'Link elküldve' : 'Magic link küldése'}
            </button>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
            {sent && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Elkészült! Nézd meg a postaládád, és kattints a belépési linkre.
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Továbbra sem kell jelszót megjegyezned – a link 5 percig érvényes.
          </p>
        </div>
      </div>
    </main>
  );
}
