'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { t } from '@/copy';
import { CONSENT_VERSION } from '@/lib/consent/constants';
import { getConsent, updateConsent } from '@/lib/consent/client';

export default function CookieBar() {
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    // Delay appearance by 3 seconds to let users see content first
    const timer = setTimeout(() => {
      const consent = getConsent();

      if (!consent || consent.version !== CONSENT_VERSION) {
        // Show the cookie bar with all cookies pre-accepted by default
        // User can click to decline or customize
        setIsVisible(true);
        // Note: We don't save consent yet - let the user make a choice
        // The default state is all enabled, so "Accept" keeps them enabled
        // and "Reject" disables analytics and marketing
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Listen for consent updates to hide the bar when consent is saved
    const handleConsentUpdated = () => {
      const consent = getConsent();
      if (consent && consent.version === CONSENT_VERSION) {
        setIsVisible(false);
      }
    };

    window.addEventListener('consent:updated', handleConsentUpdated);

    return () => {
      window.removeEventListener('consent:updated', handleConsentUpdated);
    };
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

  return (
    <div
      className="fixed bottom-4 right-4 left-4 md:left-auto max-w-md bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-6 z-[100] transition-all duration-300"
      role="dialog"
      aria-label={t('cookies.bar.message')}
      aria-live="polite"
      style={{
        animation: 'slideInFromBottom 0.3s ease-out',
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleRejectNonEssential}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Bezárás"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="mb-4 pr-8">
        <h3 className="font-bold text-navy-900 text-lg mb-2">Cookie beállítások</h3>
        <p className="text-sm text-gray-600 leading-relaxed text-pretty">
          {t('cookies.bar.message')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="flex-1 bg-turquoise-600 hover:bg-turquoise-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all min-h-[44px]"
        >
          {t('cookies.bar.accept')}
        </button>
        <button
          type="button"
          onClick={handleCustomize}
          className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all min-h-[44px]"
        >
          {t('cookies.bar.customise')}
        </button>
      </div>
    </div>
  );
}
