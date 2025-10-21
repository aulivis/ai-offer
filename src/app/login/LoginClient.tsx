'use client';

import { useState } from 'react';
import LandingHeader from '@/components/LandingHeader';
import { useSupabase } from '@/components/SupabaseProvider';

export default function LoginClient() {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function sendMagic() {
    setError(null);
    if (!email) return;
    setIsMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setError(message);
    } finally {
      setIsMagicLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) setError(error.message);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setError(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
      <div className="relative flex min-h-screen flex-col">
        <LandingHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 pb-16 pt-8">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-lg backdrop-blur">
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
              disabled={!email || sent || isMagicLoading}
              aria-busy={isMagicLoading}
            >
              {sent ? 'Link elküldve' : isMagicLoading ? 'Küldés...' : 'Magic link küldése'}
            </button>

            <div className="relative py-1 text-center text-xs uppercase tracking-wide text-slate-400">
              <span className="bg-white px-2">vagy</span>
            </div>

            <button
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={isGoogleLoading}
              aria-busy={isGoogleLoading}
            >
              {isGoogleLoading ? 'Csatlakozás...' : 'Bejelentkezés Google-lel'}
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
        </main>
      </div>
    </div>
  );
}
