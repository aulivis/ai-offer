'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const MAGIC_LINK_MESSAGE =
  'Ha létezik fiók ehhez az e-mail címhez, perceken belül elküldjük a belépési linket.';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function sendMagic() {
    setError(null);
    setSent(false);
    if (!email) return;
    setIsMagicLoading(true);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok && response.status !== 202) {
        const payload: unknown = await response
          .json()
          .catch(() => ({ error: 'Nem sikerült elküldeni a magic linket.' }));
        const message =
          payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error?: string }).error as string)
            : 'Nem sikerült elküldeni a magic linket.';
        throw new Error(message);
      }

      setSent(true);
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
      const redirectTo = `${location.origin}/dashboard`;
      const url = new URL('/api/auth/google', location.origin);
      url.searchParams.set('redirect_to', redirectTo);
      window.location.assign(url.toString());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setError(message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 pb-16 pt-12"
    >
      <Card className="w-full max-w-md space-y-8 rounded-3xl border border-border/70 bg-bg/90 p-10 text-fg shadow-card backdrop-blur">
        <div className="space-y-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg text-base font-semibold text-fg">
            P
          </span>
          <h1 className="font-sans text-4xl font-bold tracking-[-0.125rem] text-[#151035]">
            Bejelentkezés
          </h1>
          <p className="text-base text-fg-muted">Írd be az e-mail címed, és küldünk egy magic linket.</p>
        </div>

        <div className="space-y-4">
          <Input
            label="E-mail cím"
            type="email"
            placeholder="email@cimed.hu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            onClick={sendMagic}
            className="w-full"
            size="lg"
            disabled={!email || sent || isMagicLoading}
            aria-busy={isMagicLoading}
            aria-label="Magic link küldése a megadott e-mail címre"
          >
            {sent ? 'Link elküldve' : isMagicLoading ? 'Küldés…' : 'Magic link küldése'}
          </Button>

          <div className="relative py-1 text-center text-xs uppercase tracking-[0.3em] text-fg-muted">
            <span className="bg-bg px-2">vagy</span>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2"
            size="lg"
            variant="secondary"
            disabled={isGoogleLoading}
            aria-busy={isGoogleLoading}
            aria-label="Bejelentkezés Google-fiókkal"
          >
            {isGoogleLoading ? 'Csatlakozás…' : 'Bejelentkezés Google-lel'}
          </Button>

          <div aria-live="polite" className="space-y-2">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-600"
              >
                {error}
              </div>
            )}
            {sent && (
              <div
                role="status"
                className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700"
              >
                {MAGIC_LINK_MESSAGE}
              </div>
            )}
          </div>
        </div>

        <footer aria-label="Oldal lábléc" className="text-center text-xs text-fg-muted">
          Továbbra sem kell jelszót megjegyezned – a link 5 percig érvényes.
        </footer>
      </Card>
    </main>
  );
}
