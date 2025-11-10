'use client';

import { t } from '@/copy';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Shield, Star, Zap, Users, Info } from 'lucide-react';
import { getAuthorImage } from '@/lib/testimonial-images';

const MAGIC_LINK_MESSAGE = t('login.messages.magicLinkInfo');
const MAGIC_LINK_COOLDOWN_SECONDS = 60;

const TESTIMONIALS = [
  {
    quote:
      'A Vyndi-vel az ajánlatkészítési időm 70%-kal csökkent. Mostanra profin néz ki minden dokumentum és az ügyfeleim is észrevették.',
    author: 'Kiss Júlia',
    role: 'Ügynökségvezető',
    rating: 5,
    image: getAuthorImage('Kiss Júlia'),
  },
  {
    quote:
      'Az AI funkciók és a csapat együttműködés óriási időmegtakarítást jelentett. Percek alatt készítek professzionális ajánlatokat.',
    author: 'Szabó Anna',
    role: 'Projektmenedzser',
    rating: 5,
    image: getAuthorImage('Szabó Anna'),
  },
];

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
            ? ((payload as { error?: string }).error as string)
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
        : 'Ingyenes próba indítása';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-turquoise-50 flex flex-col">
      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/vyndi-logo.png"
                alt="Vyndi"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-navy-900">Vyndi</span>
            </Link>
            <div className="text-sm text-gray-600">
              <Link href="/" className="text-gray-600 hover:text-turquoise-600 transition-colors">
                Vissza a főoldalra
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
        <div className="max-w-xl w-full">
          {/* Social Proof - Above Form */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-turquoise-400 to-blue-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-bold text-navy-900">5,000+</span> elégedett felhasználó
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" strokeWidth={0} />
              ))}
              <span className="ml-2 text-sm text-gray-600">4.9/5 értékelés</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {/* Headline */}
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-turquoise-100 text-turquoise-700 rounded-full text-sm font-bold mb-4">
                🚀 Kezdd el ingyen
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4 leading-tight">
                Készíts professzionális ajánlatokat néhány perc alatt
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Kezdj el még ma. Nincs szükség bankkártyára, bármikor lemondható.
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={sendMagic} className="space-y-6 mb-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-navy-900 mb-2">
                  E-mail cím
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="pelda@email.hu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-turquoise-500 focus:border-transparent text-lg transition-all min-h-[44px]"
                  style={{ fontSize: '16px' }}
                  required
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-5 w-5 rounded border border-gray-300 bg-white text-turquoise-600 focus:ring-2 focus:ring-turquoise-500 focus:ring-offset-0"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  {t('login.rememberMe')}
                </label>
              </div>

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

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={!email || isCooldownActive || isMagicLoading}
                className="w-full bg-turquoise-600 hover:bg-turquoise-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2 group min-h-[44px]"
              >
                {magicButtonLabel}
                {!isMagicLoading && !isCooldownActive && (
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              {/* Trust Message */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-turquoise-600" />
                <span>Nincs bankkártya szükséges • Bármikor lemondható</span>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">VAGY</span>
              </div>
            </div>

            {/* Google Sign-in */}
            <button
              onClick={signInWithGoogle}
              disabled={isGoogleLoading || !isGoogleAvailable}
              className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed border-2 border-gray-200 text-navy-900 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group min-h-[44px]"
            >
              {isGoogleLoading ? (
                <span>Csatlakozás…</span>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span>Folytatás Google-lal</span>
                </>
              )}
            </button>

            {/* Privacy Notice */}
            <p className="text-xs text-center text-gray-500 mt-6 leading-relaxed">
              A regisztrációval elfogadod az{' '}
              <Link href="/adatvedelem" className="text-turquoise-600 hover:underline">
                Adatvédelmi szabályzatot
              </Link>{' '}
              és a{' '}
              <Link href="/felhasznalasi-feltetelek" className="text-turquoise-600 hover:underline">
                Felhasználási feltételeket
              </Link>
            </p>
          </div>

          {/* Key Benefits - Below Form */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-turquoise-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-turquoise-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">Gyors telepítés</h3>
              <p className="text-sm text-gray-600">2 perc alatt használható</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-turquoise-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-turquoise-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">Biztonságos</h3>
              <p className="text-sm text-gray-600">Bank szintű titkosítás</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-turquoise-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-turquoise-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-1">Támogatás</h3>
              <p className="text-sm text-gray-600">24/7 ügyfélszolgálat</p>
            </div>
          </div>

          {/* Featured Testimonial */}
          <div className="mt-12 bg-gradient-to-br from-turquoise-50 to-blue-50 rounded-2xl p-8 border border-turquoise-100">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(TESTIMONIALS[0].rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" strokeWidth={0} />
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed mb-4 italic">
              &ldquo;{TESTIMONIALS[0].quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-turquoise-100 flex-shrink-0">
                <Image
                  src={TESTIMONIALS[0].image}
                  alt={TESTIMONIALS[0].author}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-navy-900">{TESTIMONIALS[0].author}</div>
                <div className="text-sm text-gray-600">{TESTIMONIALS[0].role}</div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-turquoise-600" />
              Mi történik ezután?
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-navy-900">Kapsz egy e-mailt</div>
                  <div className="text-sm text-gray-600">Kattints a linkre a belépéshez</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-navy-900">Fiókod automatikusan létrejön</div>
                  <div className="text-sm text-gray-600">
                    Nincs szükség bonyolult regisztrációra
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-turquoise-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-navy-900">Kezdj el azonnal</div>
                  <div className="text-sm text-gray-600">
                    Készítsd el első ajánlatod 5 perc alatt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div>© 2025 Vyndi. Minden jog fenntartva.</div>
            <div className="flex items-center gap-6">
              <Link href="/adatvedelem" className="hover:text-turquoise-600">
                Adatvédelem
              </Link>
              <Link href="/felhasznalasi-feltetelek" className="hover:text-turquoise-600">
                Feltételek
              </Link>
              <Link href="/kapcsolat" className="hover:text-turquoise-600">
                Kapcsolat
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
