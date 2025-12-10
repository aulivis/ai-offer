'use client';

import { t } from '@/copy';
import Link from 'next/link';
import { useEffect, useState, useMemo, FormEvent, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { clientLogger } from '@/lib/clientLogger';
import { sanitizeInput } from '@/lib/sanitize';
import { isValidEmailFormat, validateAndNormalizeEmail } from '@/lib/validation/email';
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
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum email length
const GOOGLE_STATUS_RETRY_DELAY_MS = 2000; // 2 seconds
const GOOGLE_STATUS_MAX_RETRIES = 2;

/**
 * Safely validates and sanitizes a redirect URL
 * Only allows relative paths or same-origin URLs
 * Prevents open redirect vulnerabilities
 */
function validateRedirectUrl(url: string | null): string {
  if (!url) return '/dashboard';

  // Safety check for SSR (shouldn't happen in client component, but defensive)
  if (typeof window === 'undefined') {
    return '/dashboard';
  }

  try {
    const decoded = decodeURIComponent(url);
    // If it's a relative path, allow it (but validate it's not protocol-relative)
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      // Basic path validation - no protocol-relative or absolute URLs
      // Additional check: ensure it doesn't contain dangerous patterns
      if (decoded.includes('\0') || decoded.includes('\r') || decoded.includes('\n')) {
        return '/dashboard';
      }
      return decoded;
    }
    // If it's an absolute URL, validate it's same origin
    try {
      const urlObj = new URL(decoded, window.location.origin);
      if (urlObj.origin === window.location.origin) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }
    } catch {
      // Invalid URL, fall back to default
    }
  } catch {
    // Decode failed, fall back to default
  }

  return '/dashboard';
}

/**
 * Extracts error message from API response payload
 */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof (payload as { error?: unknown }).error === 'string'
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const redirect = searchParams?.get('redirect');
    return validateRedirectUrl(redirect);
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(true);
  const [googleStatusMessage, setGoogleStatusMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const googleStatusRetryCount = useRef(0);

  // Check for error in URL params (sanitized to prevent XSS)
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    const messageParam = searchParams?.get('message');

    if (errorParam || messageParam) {
      try {
        const rawMessage = errorParam
          ? decodeURIComponent(errorParam)
          : messageParam
            ? decodeURIComponent(messageParam)
            : null;

        // Sanitize the error message to prevent XSS
        const sanitizedMessage = rawMessage ? sanitizeInput(rawMessage) : null;
        setError(sanitizedMessage);

        const minCooldownAfterFailure = 15;
        if (cooldownRemaining < minCooldownAfterFailure) {
          setCooldownRemaining(minCooldownAfterFailure);
        }
      } catch {
        // If decode fails, ignore the error param
        setError(null);
      }
    }
  }, [searchParams, cooldownRemaining]);

  useEffect(() => {
    let ignore = false;
    let retryTimeout: number | null = null;

    async function loadGoogleStatus(retryAttempt = 0) {
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
        googleStatusRetryCount.current = 0; // Reset on success
      } catch (e) {
        clientLogger.error('Failed to query Google sign-in availability', e);
        if (ignore) return;

        // Retry logic for transient network errors
        if (retryAttempt < GOOGLE_STATUS_MAX_RETRIES) {
          googleStatusRetryCount.current = retryAttempt + 1;
          retryTimeout = window.setTimeout(() => {
            if (!ignore) {
              loadGoogleStatus(retryAttempt + 1);
            }
          }, GOOGLE_STATUS_RETRY_DELAY_MS);
        } else {
          // Max retries reached, treat as permanently unavailable
          setIsGoogleAvailable(false);
          setGoogleStatusMessage(t('login.googleUnavailable'));
          googleStatusRetryCount.current = 0;
        }
      }
    }

    loadGoogleStatus();

    return () => {
      ignore = true;
      if (retryTimeout !== null) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, []);

  // Validate email on change
  useEffect(() => {
    if (!email) {
      setEmailError(null);
      return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Email cím maximum ${MAX_EMAIL_LENGTH} karakter lehet.`);
      return;
    }

    if (!isValidEmailFormat(email)) {
      setEmailError('Kérjük, adj meg egy érvényes email címet.');
      return;
    }

    setEmailError(null);
  }, [email]);

  async function sendMagic(e?: FormEvent) {
    if (e) {
      e.preventDefault();
    }

    setError(null);
    setEmailError(null);

    // Validate email before sending
    const normalizedEmail = validateAndNormalizeEmail(email);
    if (!normalizedEmail) {
      setEmailError('Kérjük, adj meg egy érvényes email címet.');
      return;
    }

    // Don't clear sent state here - let user see success message
    setIsMagicLoading(true);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalizedEmail,
          remember_me: rememberMe,
          redirect_to: redirectTo,
        }),
      });

      if (!response.ok && response.status !== 202) {
        const payload: unknown = await response
          .json()
          .catch(() => ({ error: t('errors.network') }));
        const message = extractErrorMessage(payload, t('errors.network'));

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
      setError(null); // Clear any previous errors on success
    } catch (e) {
      const message = e instanceof Error ? e.message : t('errors.unknown');
      setError(message);
      // Only set cooldown for rate limit errors (429), not for all errors
      // The rate limit handler above already sets cooldown for 429 errors
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

  // Don't auto-hide success message when cooldown reaches 0
  // Let user manually dismiss or send again
  // Removed the auto-hide effect to improve UX

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 pt-12 md:pt-16">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Login Form */}
          <div className="w-full">
            {/* GDPR Section - Moved to top */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>GDPR kompatibilis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>Biztonságos infrastruktúra</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>99.9% elérhetőség</span>
              </div>
            </div>

            {/* Form card with prominent styling */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 md:p-8">
              {/* Adaptive hero section */}
              <div className="text-center mb-8">
                {/* Universal badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white px-4 py-2 rounded-full mb-6">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    Kezdd el 30 másodperc alatt — teljesen ingyen
                  </span>
                </div>

                {/* Neutral, inclusive heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-fg mb-4">
                  {fromSource === 'cta' || fromSource === 'pricing'
                    ? 'Indítsd a 14 napos ingyenes próbát'
                    : 'Lépj be egy kattintással'}
                </h1>

                {/* Dual-purpose subtitle */}
                <p className="text-lg text-fg-muted max-w-md mx-auto">
                  {fromSource === 'cta' || fromSource === 'pricing' ? (
                    <>
                      Fiók létrehozása 30 másodperc alatt. Már meglévő fiókkal?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSent(false);
                        }}
                        className="text-primary font-semibold hover:underline"
                      >
                        Jelentkezz be
                      </button>
                    </>
                  ) : (
                    <>
                      Beléphetsz vagy új fiókot hozhatsz létre egyetlen kattintással.
                      <br />
                      <span className="text-primary font-semibold">
                        *Nincs jelszó, nincs bankkártya, nincs bonyolult regisztráció*
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Primary method - Google (fastest) */}
              <div className="mb-6">
                <div className="text-sm text-fg-muted mb-3 text-center font-semibold">
                  Leggyorsabb módszer:
                </div>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={isGoogleLoading || !isGoogleAvailable}
                  aria-label="Bejelentkezés Google fiókkal"
                  aria-busy={isGoogleLoading}
                  aria-disabled={!isGoogleAvailable}
                  className="group w-full bg-bg-muted border-2 border-border hover:border-primary hover:shadow-pop text-fg py-4 md:py-5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
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
                        <span className="font-semibold">Google Bejelentkezés</span>
                      </div>
                      <div className="ml-auto bg-success/10 text-success text-xs px-2 py-1 rounded-full font-bold relative z-10">
                        5 mp
                      </div>
                      <span className="absolute inset-0 bg-bg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </>
                  )}
                </button>
                <p className="text-xs text-fg-muted text-center mt-2">
                  Automatikus fiók létrehozás az első bejelentkezéskor
                </p>
                {googleStatusMessage && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning"
                  >
                    {sanitizeInput(googleStatusMessage)}
                  </div>
                )}
              </div>

              {/* Visual divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-bg-muted px-4 text-sm text-fg-muted font-medium">
                    vagy email címmel
                  </span>
                </div>
              </div>

              {/* Secondary method - Magic Link */}
              <form onSubmit={sendMagic} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-fg mb-2">
                    Email cím
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fg-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= MAX_EMAIL_LENGTH) {
                          setEmail(value);
                        }
                      }}
                      placeholder="pelda@email.hu"
                      required
                      maxLength={MAX_EMAIL_LENGTH}
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      aria-label="Email cím"
                      aria-required="true"
                      aria-invalid={emailError ? 'true' : 'false'}
                      aria-describedby={emailError ? 'email-error' : undefined}
                      className={`w-full pl-12 pr-4 py-4 md:py-4 text-base md:text-lg border-2 rounded-xl focus:ring-4 focus:ring-teal-100 outline-none transition-all text-gray-900 ${
                        emailError
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p
                      id="email-error"
                      role="alert"
                      aria-live="polite"
                      className="mt-2 text-sm text-red-600"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Stay logged in checkbox - more prominent */}
                <label htmlFor="remember" className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      aria-label="Maradok bejelentkezve"
                      className="w-5 h-5 text-teal-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-teal-200 cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Maradok bejelentkezve
                  </span>
                </label>

                {/* Error state */}
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <div className="font-bold text-red-900 mb-1">Hiba történt</div>
                        <p className="text-sm text-red-700">{sanitizeInput(error)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success state - Email sent */}
                {sent && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-bold text-green-900 mb-1">Email elküldve!</div>
                        <p className="text-sm text-green-700">
                          Nézd meg az emailjeidet és kattints a belépési linkre.{' '}
                          {isCooldownActive ? (
                            <span className="font-semibold" aria-live="polite">
                              Új link {cooldownRemaining} másodperc múlva kérhető.
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSent(false);
                                setError(null);
                                sendMagic();
                              }}
                              className="underline font-semibold hover:text-green-800"
                              aria-label="Email újraküldése"
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
                  disabled={!email || isCooldownActive || isMagicLoading || !!emailError}
                  aria-label="Belépés Magic Link-kel"
                  aria-busy={isMagicLoading}
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
                    Küldünk egy belépési linket az emailedre. Nincs jelszó, nincs külön
                    regisztrációs folyamat!
                  </p>
                </div>
              </form>

              {/* Privacy note */}
              <p className="mt-6 text-center text-xs text-gray-500">
                A gombra kattintva elfogadod az{' '}
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
                {/* What you get after signup */}
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Mit kapsz azonnal a regisztráció után?
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">2 aktív ajánlat</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Kezdj el azonnal professzionális ajánlatokat készíteni — teljesen ingyen
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
                        <h3 className="font-bold text-gray-900 mb-1">Kész sablon</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Formázott sablon a vállalkozásod színeivel
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
                        <h3 className="font-bold text-gray-900 mb-1">PDF-export</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Egy kattintással letölthető, ügyfélnek küldhető ajánlat
                        </p>
                        <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Azonnal elérhető</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade callout */}
                  <div className="mt-6 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl p-6 text-center">
                    <Crown className="w-6 h-6 mx-auto mb-2 text-white" />
                    <h3 className="text-lg font-bold text-white mb-1">
                      Szeretnél több funkciót korlátlanul?
                    </h3>
                    <p className="text-teal-100 text-sm">
                      Frissíts bármikor Standard vagy Pro csomagra — több ajánlat, több sablon,
                      teljes branding és haladó funkciók várnak rád.
                    </p>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Nem kell bankkártya</div>
                    <div className="text-sm text-gray-600">Azonnal használható, ingyenes fiók</div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Biztonságos belépés</div>
                    <div className="text-sm text-gray-600">
                      256-bit SSL titkosítás és Magic Link
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Villámgyors</div>
                    <div className="text-sm text-gray-600">
                      Belépés 5 másodperc alatt, külön regisztráció nélkül
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-orange-600" />
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Segítünk, ha elakadsz</div>
                    <div className="text-sm text-gray-600">Barátságos támogatás magyarul</div>
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
