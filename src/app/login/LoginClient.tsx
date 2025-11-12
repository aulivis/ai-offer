'use client';

import { t } from '@/copy';
import Link from 'next/link';
import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Zap,
  Users,
  Lock,
  Mail,
  ArrowRight,
  Info,
  Shield,
  CheckCircle,
  FileText,
  Palette,
  Sparkles,
  Crown,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

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

  // Detect if user came from CTA/pricing (could be enhanced with referrer detection)
  const fromSource = searchParams?.get('from') || 'default';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 pt-24 md:pt-32">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Login Form */}
          <div className="w-full">
            {/* Form card with prominent styling */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 md:p-8">
              {/* Adaptive hero section */}
              <div className="text-center mb-8">
                {/* Universal badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white px-4 py-2 rounded-full mb-6">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Kezdés 30 másodperc alatt - Ingyenes
                  </span>
                </div>

                {/* Neutral, inclusive heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {fromSource === 'cta' || fromSource === 'pricing'
                    ? 'Indítsd a 14 napos ingyenes próbát'
                    : 'Kezdd el most'}
                </h1>

                {/* Dual-purpose subtitle */}
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  {fromSource === 'cta' || fromSource === 'pricing' ? (
                    <>
                      Fiók létrehozása 30 másodperc alatt. Már meglévő fiókkal?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSent(false);
                        }}
                        className="text-teal-600 font-semibold hover:underline"
                      >
                        Jelentkezz be
                      </button>
                    </>
                  ) : (
                    <>
                      Jelentkezz be vagy hozz létre új fiókot egyetlen kattintással.{' '}
                      <span className="text-teal-600 font-semibold">
                        Nincs jelszó, nincs bonyolult regisztráció.
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Primary method - Google (fastest) */}
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-3 text-center font-semibold">
                  Leggyorsabb módszer:
                </div>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={isGoogleLoading || !isGoogleAvailable}
                  className="group w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:shadow-xl text-gray-700 py-4 md:py-5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Csatlakozás…</span>
                    </>
                  ) : (
                    <>
                      <div className="relative z-10 flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                        <span className="font-semibold">Folytatás Google-lal</span>
                      </div>
                      <div className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold relative z-10">
                        5 mp
                      </div>
                      <span className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Automatikus fiók létrehozás az első bejelentkezéskor
                </p>
                {googleStatusMessage && (
                  <div
                    role="alert"
                    className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
                  >
                    {googleStatusMessage}
                  </div>
                )}
              </div>

              {/* Visual divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500 font-medium">
                    vagy email címmel
                  </span>
                </div>
              </div>

              {/* Secondary method - Magic Link */}
              <form onSubmit={sendMagic} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email cím
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pelda@email.hu"
                      required
                      className="w-full pl-12 pr-4 py-4 md:py-4 text-base md:text-lg border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Stay logged in checkbox - more prominent */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-teal-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-teal-200 cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Maradok bejelentkezve
                  </span>
                </label>

                {/* Error state */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-red-900 mb-1">Hiba történt</div>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success state - Email sent */}
                {sent && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-green-900 mb-1">Email elküldve!</div>
                        <p className="text-sm text-green-700">
                          Nézd meg az emailjeidet és kattints a belépési linkre.{' '}
                          {isCooldownActive ? (
                            <span className="font-semibold">
                              Új link {cooldownRemaining} másodperc múlva kérhető.
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSent(false);
                                sendMagic();
                              }}
                              className="underline font-semibold"
                            >
                              Küldés újra
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Magic link CTA */}
                <button
                  type="submit"
                  disabled={!email || isCooldownActive || isMagicLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 md:py-5 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isMagicLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Küldés...</span>
                    </>
                  ) : (
                    <>
                      <span>Belépés Magic Link-kel</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-teal-700">
                    Küldünk egy belépési linket az emailedre. Nincs jelszó, nincs regisztráció!
                  </p>
                </div>
              </form>

              {/* Privacy note */}
              <p className="mt-6 text-center text-xs text-gray-500">
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
          </div>

          {/* Right Column - Content */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="space-y-8">
                {/* Trust indicators */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Nincs bankkártya</div>
                    <div className="text-sm text-gray-600">Azonnal használható ingyenes fiók</div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Biztonságos</div>
                    <div className="text-sm text-gray-600">256-bit SSL titkosítás</div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Villámgyors</div>
                    <div className="text-sm text-gray-600">Belépés 5 másodperc alatt</div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-orange-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">24/7 Támogatás</div>
                    <div className="text-sm text-gray-600">Mindig itt vagyunk neked</div>
                  </div>
                </div>

                {/* Additional security badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>GDPR megfelelő</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>ISO 27001 minősített</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>SOC 2 Type II</span>
                  </div>
                </div>

                {/* What you get after signup */}
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Mit kapsz azonnal a regisztrációval?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Minden funkció elérhető az ingyenes fiókkal, azonnal
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">5 aktív ajánlat</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Kezdj el azonnal professzionális ajánlatokat készíteni ingyen
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Azonnal elérhető</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Palette className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Alap sablonok</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Használj 10+ profi sablont azonnali induláshoz
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Azonnal elérhető</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">14 napos próba</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Kipróbálhatod az összes Premium funkciót ingyen
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Automatikusan aktiválva</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade callout */}
                  <div className="mt-6 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl p-6 text-center">
                    <Crown className="w-6 h-6 mx-auto mb-2 text-white" />
                    <h3 className="text-lg font-bold text-white mb-1">
                      Próbáld ki a Premium funkciókat 14 napig ingyen
                    </h3>
                    <p className="text-teal-100 text-sm">
                      Korlátlan ajánlat, AI segédlet, egyedi branding és még sok más
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
