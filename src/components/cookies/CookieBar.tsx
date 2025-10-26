'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';

const CONSENT_COOKIE_NAME = 'propono_cookie_consent';
const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

type ConsentCategories = {
  analytics: boolean;
  marketing: boolean;
};

type ConsentCookieValue = {
  version: number;
  updatedAt: string;
  categories: ConsentCategories;
};

function readConsentCookie(): ConsentCookieValue | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const consentCookie = cookies.find((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!consentCookie) {
    return null;
  }

  const value = consentCookie.substring(CONSENT_COOKIE_NAME.length + 1);

  try {
    return JSON.parse(decodeURIComponent(value)) as ConsentCookieValue;
  } catch (error) {
    console.warn('Failed to parse cookie consent value', error);
    return null;
  }
}

function saveConsentCookie(categories: ConsentCategories) {
  if (typeof document === 'undefined') {
    return;
  }

  const payload: ConsentCookieValue = {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    categories,
  };

  let cookieString = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

function emitConsentUpdated(categories: ConsentCategories) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('consent:updated', {
      detail: {
        categories,
      },
    }),
  );
}

export default function CookieBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = readConsentCookie();

    if (!consent || consent.version !== CONSENT_VERSION) {
      setIsVisible(true);
    }
  }, []);

  const saveConsent = useCallback((categories: ConsentCategories) => {
    saveConsentCookie(categories);
    emitConsentUpdated(categories);
    setIsVisible(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({ analytics: true, marketing: true });
  }, [saveConsent]);

  const handleRejectNonEssential = useCallback(() => {
    saveConsent({ analytics: false, marketing: false });
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
            We use cookies to improve your experience. You can accept all cookies, reject the non-essential ones,
            or customise your preferences.
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
