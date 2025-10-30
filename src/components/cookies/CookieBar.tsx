'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useState } from 'react';

import { CONSENT_VERSION } from '@/lib/consent/constants';
import { getConsent, updateConsent } from '@/lib/consent/client';

export default function CookieBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();

    if (!consent || consent.version !== CONSENT_VERSION) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = useCallback(async (analytics: boolean, marketing: boolean) => {
    const record = await updateConsent({
      necessary: true,
      analytics,
      marketing,
    });

    window.dispatchEvent(
      new CustomEvent('consent:updated', {
        detail: {
          categories: record.granted,
        },
      }),
    );

    setIsVisible(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    void saveConsent(true, true);
  }, [saveConsent]);

  const handleRejectNonEssential = useCallback(() => {
    void saveConsent(false, false);
  }, [saveConsent]);

  const handleCustomize = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('consent:openPreferences'));
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const baseButtonClass =
    'inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]';

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#111827] text-[#F8FAFC]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-sm text-[#F8FAFC]/90 sm:text-left">
          We use cookies to improve your experience. You can accept all cookies, reject the
          non-essential ones, or customize your preferences.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleCustomize}
            className={`${baseButtonClass} hover:bg-white/10`}
          >
            Customize
          </button>
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className={`${baseButtonClass} hover:bg-white/10`}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className={`${baseButtonClass} border-transparent bg-white text-[#111827] hover:bg-white/90`}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
