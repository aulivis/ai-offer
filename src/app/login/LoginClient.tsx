'use client';

import { t } from '@/copy';
import Image from 'next/image';
import { type CSSProperties, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { HelpIcon } from '@/components/ui/HelpIcon';

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
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const redirect = searchParams?.get('redirect');
    return redirect ? decodeURIComponent(redirect) : '/dashboard';
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(true);
  const [googleStatusMessage, setGoogleStatusMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for error in URL params (e.g., from init-session failure)
  // Set a minimum cooldown to prevent immediate retry after failure
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    const messageParam = searchParams?.get('message');
    
    if (errorParam || messageParam) {
      // Show error message
      setError(errorParam ? decodeURIComponent(errorParam) : messageParam ? decodeURIComponent(messageParam) : null);
      
      // Set a minimum cooldown (15 seconds) to prevent immediate retry
      // This prevents rapid-fire requests when session init fails
      const minCooldownAfterFailure = 15;
      if (cooldownRemaining < minCooldownAfterFailure) {
        setCooldownRemaining(minCooldownAfterFailure);
      }
    }
  }, [searchParams, cooldownRemaining]);

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
        body: JSON.stringify({ email, remember_me: rememberMe, redirect_to: redirectTo }),
      });

      if (!response.ok && response.status !== 202) {
        const payload: unknown = await response
          .json()
          .catch(() => ({ error: t('errors.network') }));
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error?: string }).error as string)
            : t('errors.network');
        
        // Handle rate limit errors (429)
        if (response.status === 429) {
          const retryAfter = 
            payload &&
            typeof payload === 'object' &&
            'retryAfter' in payload &&
            typeof (payload as { retryAfter?: unknown }).retryAfter === 'number'
              ? (payload as { retryAfter: number }).retryAfter
              : response.headers.get('Retry-After')
                ? parseInt(response.headers.get('Retry-After')!, 10)
                : MAGIC_LINK_COOLDOWN_SECONDS;
          
          setCooldownRemaining(Math.max(retryAfter, cooldownRemaining));
          throw new Error(message || 'Too many requests. Please wait before trying again.');
        }
        
        throw new Error(message);
      }

      setSent(true);
      setCooldownRemaining(MAGIC_LINK_COOLDOWN_SECONDS);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('errors.unknown');
      setError(message);
      // Don't reset cooldown to 0 on error - keep existing cooldown or set minimum
      if (cooldownRemaining === 0) {
        // Set a minimum cooldown of 5 seconds after any error to prevent rapid retries
        setCooldownRemaining(5);
      }
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
      const url = new URL('/api/auth/google', location.origin);
      url.searchParams.set('redirect_to', redirectTo);
      if (rememberMe) {
        url.searchParams.set('remember_me', 'true');
      }
      window.location.assign(url.toString());
    } catch (e) {
      const message = e instanceof Error ? e.message : t('errors.unknown');
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
        {/* Left Side - Benefits & Value Props */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-[#1c274c]">
              {t('login.benefits.title')}
            </h2>
            <p className="text-lg text-fg-muted leading-relaxed">
              {t('login.benefits.subtitle')}
            </p>
          </div>
          <ul className="space-y-4">
            {[
              t('login.benefits.items.0'),
              t('login.benefits.items.1'),
              t('login.benefits.items.2'),
              t('login.benefits.items.3'),
            ].map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-base text-fg-muted leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
          
          {/* Trust Indicators */}
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-fg">{t('login.trust.noCreditCard')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-fg">{t('login.trust.instantAccess')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-fg">{t('login.trust.cancelAnytime')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full space-y-6 rounded-3xl border border-border/70 bg-bg/90 p-8 md:p-10 text-fg shadow-card backdrop-blur">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/vyndi-logo.png"
              alt="Vyndi"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-[-0.125rem] text-[#1c274c] md:text-4xl">
            {t('login.title')}
          </h1>
          <p className="text-sm text-fg-muted leading-relaxed md:text-base">
            {t('login.description')}
          </p>
          {/* Account Creation Notice */}
          <div className="mx-auto max-w-md rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-3 text-left">
            <p className="text-xs font-medium text-emerald-800 md:text-sm">
              {t('login.accountCreationNotice')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label={t('login.emailLabel')}
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded border border-border bg-bg text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary accent-primary"
              />
              <span className="text-sm text-fg">{t('login.rememberMe')}</span>
              <HelpIcon
                content={t('login.rememberMeHelp')}
                label={t('login.rememberMeHelp')}
              />
            </label>
          </div>

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
                className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-700"
              >
                {googleStatusMessage}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-600"
              >
                {error}
              </div>
            )}
            {sent && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700"
              >
                <p className="font-medium">{MAGIC_LINK_MESSAGE}</p>
                {isCooldownActive && (
                  <p className="mt-1 text-xs text-emerald-600">
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
