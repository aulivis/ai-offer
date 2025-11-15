'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/ToastProvider';
import { useState } from 'react';

type SettingsSecurityTabProps = {
  googleLinked: boolean;
  linkingGoogle: boolean;
  email: string | null;
  onLinkGoogle: () => void;
};

export function SettingsSecurityTab({
  googleLinked,
  linkingGoogle,
  email,
  onLinkGoogle,
}: SettingsSecurityTabProps) {
  const { showToast } = useToast();
  const [sendingTestMagicLink, setSendingTestMagicLink] = useState(false);

  const handleSendTestMagicLink = async () => {
    if (!email) {
      showToast({
        title: 'Email cím szükséges',
        description: 'Nincs beállítva email cím a magic link küldéséhez.',
        variant: 'error',
      });
      return;
    }

    setSendingTestMagicLink(true);
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, redirect_to: '/settings' }),
      });

      if (!response.ok && response.status !== 202) {
        const payload: unknown = await response.json().catch(() => ({ error: 'Hiba történt' }));
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? ((payload as { error: string }).error as string)
            : 'Nem sikerült elküldeni a magic linket';

        throw new Error(message);
      }

      showToast({
        title: 'Magic link elküldve',
        description: `Ellenőrizd az email fiókodat (${email}). A link néhány percig érvényes.`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba';
      showToast({
        title: 'Hiba történt',
        description: message,
        variant: 'error',
      });
    } finally {
      setSendingTestMagicLink(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Connected auth methods */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <LockClosedIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {t('settings.authMethods.title')}
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              Két egyszerű és biztonságos módszer a bejelentkezésre
            </p>
          </div>
        </div>
      </div>

      {/* Google - Connected */}
      <div className="mb-4 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Google fiók</h3>
                {googleLinked ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
                    <CheckCircleIcon className="h-3 w-3" />
                    Aktív
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">
                    Nincs csatlakoztatva
                  </span>
                )}
              </div>
              {email && (
                <p className="mb-3 text-sm text-slate-700">
                  <span className="font-semibold">{email}</span>
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                {googleLinked && (
                  <>
                    <div className="flex items-center gap-2 text-slate-600">
                      <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                      <span>Biztonságos bejelentkezés</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1 text-green-700">
                      <BoltIcon className="h-4 w-4" />
                      <span className="font-semibold">Gyors és biztonságos</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {googleLinked ? (
            <Button
              type="button"
              onClick={onLinkGoogle}
              disabled={linkingGoogle}
              variant="secondary"
              size="sm"
            >
              {linkingGoogle ? 'Feldolgozás...' : 'Leválasztás'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onLinkGoogle}
              disabled={linkingGoogle}
              variant="primary"
              size="sm"
            >
              {linkingGoogle ? 'Átirányítás...' : 'Csatlakoztatás'}
            </Button>
          )}
        </div>
      </div>

      {/* Magic Link - Primary email method */}
      <div className="rounded-2xl border-2 border-blue-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">
                Varázslatos link (Magic Link)
              </h3>
              <p className="mb-3 text-sm text-slate-600">
                Jelszó nélküli bejelentkezés email linkkel
              </p>
              {email && (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">{email}</span>
                </div>
              )}
            </div>
          </div>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
            Elérhető
          </span>
        </div>

        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-1 font-semibold">Hogyan működik?</p>
              <p>
                A bejelentkezési oldalon add meg az email címed, és egy egyedi linket küldünk,
                amivel egyetlen kattintással bejelentkezhetsz. Nincs szükség jelszóra.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSendTestMagicLink}
          disabled={sendingTestMagicLink || !email}
          variant="primary"
          className="mt-4 w-full"
        >
          {sendingTestMagicLink ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Küldés...
            </>
          ) : (
            <>
              <EnvelopeIcon className="h-5 w-5" />
              Próba magic link küldése
            </>
          )}
        </Button>
      </div>

      {/* Info box about security */}
      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100">
            <LockClosedIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="mb-2 font-bold text-slate-900">Miért nincs jelszó?</h3>
            <p className="mb-3 text-sm text-slate-700">
              A jelszavak biztonsági kockázatot jelentenek. A Google OAuth és a magic link
              modernebb, biztonságosabb módszerek, amiket nem lehet elfelejteni vagy ellopni.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-semibold">Biztonságosabb</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-semibold">Egyszerűbb</span>
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-semibold">Gyorsabb</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email for magic link */}
      <div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Email cím</h2>
        <p className="mb-6 text-slate-600">
          Ez az email cím a magic link bejelentkezéshez és értesítésekhez használatos
        </p>

        <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Elsődleges email cím
          </label>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={email || ''}
              className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              disabled
            />
            <Button type="button" variant="primary" disabled>
              Módosítás
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Email cím módosításához megerősítő linket küldünk a régi és az új címre is
          </p>
        </div>
      </div>
    </div>
  );
}
