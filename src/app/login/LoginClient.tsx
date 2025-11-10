'use client';

import { t } from '@/copy';
import Link from 'next/link';
import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Users, Lock } from 'lucide-react';

const MAGIC_LINK_MESSAGE = t('login.messages.magicLinkInfo');
const MAGIC_LINK_COOLDOWN_SECONDS = 60;

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
  const [isSignup, setIsSignup] = useState(false);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    const messageParam = searchParams?.get('message');

    if (errorParam || messageParam) {
      setError(
        errorParam
          ? decodeURIComponent(errorParam)
          : messageParam
            ? decodeURIComponent(messageParam)
            : null,
      );

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

  async function sendMagic(e?: FormEvent) {
    if (e) {
      e.preventDefault();
    }
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
            ? ((payload as { error: string }).error as string)
            : t('errors.network');

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
      if (cooldownRemaining === 0) {
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
        : isSignup
          ? 'Ingyenes próba indítása →'
          : 'Bejelentkezés';

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4 pt-32">
      <div className="w-full max-w-md">
        {/* Trust badge above form */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-50 rounded-full mb-4">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-turquoise-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm font-semibold text-turquoise-700">
              5,000+ elégedett felhasználó
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600 font-medium">4.5/5 értékelés</span>
          </div>
        </div>

        {/* Form card with prominent styling */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Badge and headline */}
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1.5 bg-turquoise-100 text-turquoise-700 rounded-full text-xs font-bold mb-3">
              ✓ Kezdd el ingyen
            </div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2">
              {isSignup ? 'Készíts professzionális ajánlatokat' : 'Üdvözöljük újra!'}
            </h1>
            <p className="text-gray-600">
              {isSignup
                ? 'Kezdj el ma. Nincs szükség bankkártyára, bármikor lemondható.'
                : 'Jelentkezz be a fiókodba'}
            </p>
          </div>

          {/* Auth form with proper spacing */}
          <form onSubmit={sendMagic} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                E-mail cím
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                required
                className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-turquoise-500 focus:bg-white focus:outline-none text-base transition-colors"
              />
            </div>

            {/* Remember me checkbox - only for login */}
            {!isSignup && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-turquoise-600 focus:ring-2 focus:ring-turquoise-500"
                />
                <label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Maradok bejelentkezve
                </label>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
              >
                {error}
              </div>
            )}

            {sent && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <p className="font-medium">{MAGIC_LINK_MESSAGE}</p>
                {isCooldownActive && (
                  <p className="mt-1 text-xs text-emerald-600">
                    {t('login.messages.magicLinkResendTimer', { seconds: cooldownRemaining })}
                  </p>
                )}
              </div>
            )}

            {googleStatusMessage && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
              >
                {googleStatusMessage}
              </div>
            )}

            {/* Prominent CTA button with turquoise gradient */}
            <button
              type="submit"
              disabled={!email || isCooldownActive || isMagicLoading}
              className="w-full h-14 bg-gradient-to-r from-turquoise-500 to-turquoise-600 hover:from-turquoise-600 hover:to-turquoise-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:hover:scale-100"
            >
              {magicButtonLabel}
            </button>
          </form>

          {/* Trust signals below button */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Nincs bankkártya szükséges</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Bármikor lemondható</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>5 perc alatt indulás</span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500 font-medium">VAGY</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isGoogleLoading || !isGoogleAvailable}
            className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed font-semibold text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <span>Csatlakozás…</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Folytatás Google-lal
              </>
            )}
          </button>

          {/* Toggle between login/signup */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {isSignup ? 'Már van fiókod?' : 'Még nincs fiókod?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError(null);
                setSent(false);
              }}
              className="text-turquoise-600 hover:text-turquoise-700 font-semibold underline"
            >
              {isSignup ? 'Jelentkezz be' : 'Regisztrálj ingyen'}
            </button>
          </p>

          {/* Privacy note */}
          <p className="mt-4 text-center text-xs text-gray-500">
            A regisztrációval elfogadod az{' '}
            <Link href="/adatvedelem" className="underline hover:text-gray-700">
              Adatvédelmi szabályzatot
            </Link>{' '}
            és a{' '}
            <Link href="/felhasznalasi-feltetelek" className="underline hover:text-gray-700">
              Felhasználási feltételeket
            </Link>
          </p>
        </div>

        {/* Benefits below form - minimal, not overwhelming */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-turquoise-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-turquoise-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Gyors telepítés</p>
            <p className="text-xs text-gray-500">2 perc alatt használható</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Biztonságos</p>
            <p className="text-xs text-gray-500">Bank szintű titkosítás</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Támogatás</p>
            <p className="text-xs text-gray-500">24/7 ügyfélszolgálat</p>
          </div>
        </div>
      </div>
    </main>
  );
}
