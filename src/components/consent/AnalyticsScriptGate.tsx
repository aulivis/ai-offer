'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

import { envClient } from '@/env.client';
import { canRun, onConsentChange } from '@/lib/consent/gate';

const GA_MEASUREMENT_ID = envClient.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function AnalyticsScriptGate() {
  const [hasConsent, setHasConsent] = useState(() => canRun('analytics'));

  useEffect(() => {
    if (hasConsent) {
      return;
    }

    const unsubscribe = onConsentChange((categories) => {
      if (categories.analytics) {
        setHasConsent(true);
      }
    });

    return unsubscribe;
  }, [hasConsent]);

  if (!GA_MEASUREMENT_ID || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="ga" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
