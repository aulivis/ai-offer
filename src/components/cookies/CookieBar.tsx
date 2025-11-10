'use client';

import { useCallback, useEffect, useState } from 'react';

import { t } from '@/copy';
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
    'inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]';

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#111827] text-[#F8FAFC] shadow-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <p className="flex-shrink-0 text-center text-sm text-[#F8FAFC]/90 sm:text-left">
          {t('cookies.bar.message')}
        </p>
        <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto sm:justify-end">
          <button
            type="button"
            onClick={handleCustomize}
            className={`${baseButtonClass} flex-shrink-0 hover:bg-white/10 active:bg-white/20`}
            style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
          >
            {t('cookies.bar.customise')}
          </button>
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className={`${baseButtonClass} flex-shrink-0 hover:bg-white/10 active:bg-white/20`}
            style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
          >
            {t('cookies.bar.reject')}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className={`${baseButtonClass} flex-shrink-0 border-transparent bg-white text-[#111827] hover:bg-white/90 active:bg-white/80`}
            style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
          >
            {t('cookies.bar.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
