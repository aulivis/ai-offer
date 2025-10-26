'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            We use cookies to improve your experience. You can accept all cookies, reject the
            non-essential ones, or customise your preferences.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCustomize}>
              Customize
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleRejectNonEssential}>
              Reject non-essential
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleAcceptAll}>
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
