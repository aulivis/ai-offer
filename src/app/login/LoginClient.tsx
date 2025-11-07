'use client';

import { t } from '@/copy';
import Image from 'next/image';
import { type CSSProperties, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';

const MAGIC_LINK_MESSAGE = t('login.messages.magicLinkInfo');
const MAGIC_LINK_COOLDOWN_SECONDS = 60;
const GOOGLE_BUTTON_STYLES: CSSProperties = {
  '--btn-bg': '#ffffff',
  '--btn-fg': '#1f1f1f',
  '--btn-border': '#475569',
  '--btn-hover-border': '#4285f4',
  '--btn-hover-bg': '#f8fafc',
} as CSSProperties;

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(true);
  const [googleStatusMessage, setGoogleStatusMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadGoogleStatus() {
      try {
        const response = await fetch('/api/auth/google/status');
        const payload: unknown = await response.json().catch(() => null);

        if (ignore) return;

        const enabled =
          payload &&
          typeof payload === 'object' &&
          'enabled' in payload &&
          typeof (payload as { enabled?: unknown }).enabled === 'boolean'
            ? (payload as { enabled: boolean }).enabled
            : false;

        const message =
          payload &&
          typeof payload === 'object' &&
          'message' in payload &&
          typeof (payload as { message?: unknown }).message === 'string'
            ? ((payload as { message: string }).message as string)
            : null;

        setIsGoogleAvailable(enabled);
        setGoogleStatusMessage(enabled ? null : message);
      } catch (e) {
        console.error('Failed to query Google sign-in availability.', e);
        if (ignore) return;
        setIsGoogleAvailable(false);
        setGoogleStatusMessage(t('login.googleUnavailable'));
      }
    }

    loadGoogleStatus();

    return () => {
      ignore = true;
    };
  }, []);

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
        body: JSON.stringify({ email, remember_me: rememberMe }),
      });

      if (!response.ok && response.status !== 202) {
        const payload: unknown = await response
          .json()
          .catch(() => ({ error: 'Nem sikerült elküldeni a magic linket.' }));
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error?: string }).error as string)
            : 'Nem sikerült elküldeni a magic linket.';
        throw new Error(message);
      }

      setSent(true);
      setCooldownRemaining(MAGIC_LINK_COOLDOWN_SECONDS);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setError(message);
      setCooldownRemaining(0);
    } finally {
      setIsMagicLoading(false);
    }
  }

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownRemaining((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownRemaining]);

  useEffect(() => {
    if (!sent) {
      return;
    }

    if (cooldownRemaining === 0) {
      setSent(false);
    }
  }, [cooldownRemaining, sent]);

  const isCooldownActive = cooldownRemaining > 0;

  const magicButtonLabel = isMagicLoading
    ? t('login.magicLinkSending')
    : isCooldownActive
      ? t('login.magicLinkResendCountdown', { seconds: cooldownRemaining })
      : sent
        ? t('login.magicLinkSent')
        : t('login.magicLinkButton');

  async function signInWithGoogle() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      if (!isGoogleAvailable) {
        throw new Error(googleStatusMessage ?? t('login.googleDisabledFallback'));
      }
      const redirectTo = `${location.origin}/dashboard`;
      const url = new URL('/api/auth/google', location.origin);
      url.searchParams.set('redirect_to', redirectTo);
      if (rememberMe) {
        url.searchParams.set('remember_me', 'true');
      }
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
      <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="hidden lg:block space-y-6">
          <h2 className="text-3xl font-bold text-[#1c274c]">
            Miért válaszd a Vyndi-t?
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary flex-none" />
              <span className="text-base text-fg-muted">AI-alapú automatikus ajánlatkészítés</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary flex-none" />
              <span className="text-base text-fg-muted">Márkázott PDF-ek professzionális megjelenéssel</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary flex-none" />
              <span className="text-base text-fg-muted">Interaktív visszajelzések és státusz követés</span>
            </li>
          </ul>
        </div>

        <Card className="w-full space-y-8 rounded-3xl border border-border/70 bg-bg/90 p-10 text-fg shadow-card backdrop-blur">
        <div className="space-y-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg text-base font-semibold text-fg">
            V
          </span>
          <h1 className="font-sans text-4xl font-bold tracking-[-0.125rem] text-[#1c274c]">
            {t('login.title')}
          </h1>
          <p className="text-base text-fg-muted">{t('login.description')}</p>
        </div>

        <div className="space-y-4">
          <Input
            label={t('login.emailLabel')}
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label={t('login.rememberMe')}
            help={t('login.rememberMeHelp')}
          />

          <Button
            onClick={sendMagic}
            className="w-full group"
            size="lg"
            disabled={!email || isCooldownActive || isMagicLoading}
            aria-busy={isMagicLoading}
            aria-label={t('login.magicLinkAria')}
          >
            <span>{magicButtonLabel}</span>
            {!isMagicLoading && !isCooldownActive && (
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </Button>

          <div className="relative py-1 text-center text-xs uppercase tracking-[0.3em] text-fg-muted">
            <span className="bg-bg px-2">{t('login.divider')}</span>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 text-base font-semibold"
            size="lg"
            variant="secondary"
            style={GOOGLE_BUTTON_STYLES}
            disabled={isGoogleLoading || !isGoogleAvailable}
            aria-busy={isGoogleLoading}
            aria-label={t('login.googleButton')}
          >
            {isGoogleLoading ? (
              t('login.googleJoining')
            ) : (
              <>
                <span className="flex h-5 w-5 items-center justify-center">
                  <Image src="/google-logo.svg" alt="" width={18} height={18} aria-hidden="true" />
                </span>
                <span className="leading-none">{t('login.googleButton')}</span>
              </>
            )}
          </Button>

          <div aria-live="polite" className="space-y-2">
            {googleStatusMessage && (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-700"
              >
                {googleStatusMessage}
              </div>
            )}
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
                <p>{MAGIC_LINK_MESSAGE}</p>
                {isCooldownActive && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {t('login.messages.magicLinkResendTimer', { seconds: cooldownRemaining })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        </Card>
      </div>
    </main>
  );
}
