import './globals.css';
import type { Metadata, Viewport } from 'next';
import { t } from '@/copy';

import AnalyticsScriptGate from '@/components/consent/AnalyticsScriptGate';
import CookieBar from '@/components/cookies/CookieBar';
import { PreferencesModal } from '@/components/cookies/PreferencesModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ConditionalLayout,
  ConditionalBackgroundDecorations,
} from '@/components/ConditionalLayout';
import { AppProviders } from '@/components/AppProviders';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';

import { LanguageProvider } from '@/state/LanguageProvider';
import { withLanguage } from '@/state/lang.server';
import { getRequestLanguage } from './lib/language';
import { ViewTransition } from '@/components/animations/ViewTransition';

import { gota, inter, spaceMono } from './fonts';

export const metadata: Metadata = {
  title: 'Vyndi – AI-alapú ajánlatkészítő platform | Professzionális ajánlat percek alatt',
  description:
    'Automatizáld az ajánlatkészítést mesterséges intelligenciával. Készítsd el az első professzionális ajánlatod 5 perc alatt – ingyen, bankkártya nélkül.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/vyndi-logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/vyndi-logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#009688', // turquoise-600
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await getRequestLanguage();

  return withLanguage(language, () => (
    <html lang={language} className={`${inter.variable} ${gota.variable} ${spaceMono.variable}`}>
      <body className="bg-bg font-sans text-fg antialiased">
        <LanguageProvider initialLanguage={language}>
          <a href="#main" className="skip-link">
            {t('app.skipToContent')}
          </a>
          <AppProviders>
            <ErrorBoundary>
              <div className="relative min-h-screen overflow-x-hidden bg-bg text-fg">
                <ConditionalBackgroundDecorations />

                <div className="relative z-10 flex min-h-screen flex-col">
                  <AriaLiveAnnouncer />
                  <WebVitalsReporter />
                  <ViewTransition>
                    <ConditionalLayout>{children}</ConditionalLayout>
                  </ViewTransition>
                </div>
              </div>
              {/* Global UI elements rendered outside main container to avoid stacking context issues */}
              <CookieBar />
              <PreferencesModal />
              <AnalyticsScriptGate />
              <ScrollToTop />
            </ErrorBoundary>
          </AppProviders>
        </LanguageProvider>
      </body>
    </html>
  ));
}
