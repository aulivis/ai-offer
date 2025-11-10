'use client';

import { useCallback, useEffect, useState } from 'react';

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
    const consent = getConsent();

    if (!consent || consent.version !== CONSENT_VERSION) {
      // Show the cookie bar with all cookies pre-accepted by default
      // User can click to decline or customize
      setIsVisible(true);
      // Note: We don't save consent yet - let the user make a choice
      // The default state is all enabled, so "Accept" keeps them enabled
      // and "Reject" disables analytics and marketing
    }
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
      className="fixed inset-x-0 bottom-0 z-[100] bg-[#111827]/67 backdrop-blur-sm text-[#F8FAFC] shadow-2xl border-t border-white/10"
      role="dialog"
      aria-label={t('cookies.bar.message')}
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {/* Message text - takes available space, doesn't overlap buttons */}
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed text-[#F8FAFC]/95 sm:text-base">
              {t('cookies.bar.message')}
            </p>
          </div>

          {/* Button group - properly spaced, equal prominence */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 flex-shrink-0">
            {/* Customize button - secondary action */}
            <button
              type="button"
              onClick={handleCustomize}
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:border-white/30 active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] whitespace-nowrap"
            >
              {t('cookies.bar.customise')}
            </button>

            {/* Reject button - equal prominence to Accept */}
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40 active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] whitespace-nowrap"
            >
              {t('cookies.bar.reject')}
            </button>

            {/* Accept button - primary action, but not overly emphasized */}
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-all hover:bg-white/90 active:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] whitespace-nowrap"
            >
              {t('cookies.bar.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
