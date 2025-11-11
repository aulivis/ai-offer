import './globals.css';
import type { Metadata, Viewport } from 'next';
import { t } from '@/copy';

import AnalyticsScriptGate from '@/components/consent/AnalyticsScriptGate';
import CookieBar from '@/components/cookies/CookieBar';
import { PreferencesModal } from '@/components/cookies/PreferencesModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LandingHeader from '@/components/LandingHeader';
import { Footer } from '@/components/footer';
import { AppProviders } from '@/components/AppProviders';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';

import { LanguageProvider } from '@/state/LanguageProvider';
import { withLanguage } from '@/state/lang.server';
import { getRequestLanguage } from './lib/language';

import { gota, spaceMono, workSans } from './fonts';

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
    <html lang={language} className={`${workSans.variable} ${gota.variable} ${spaceMono.variable}`}>
      <body className="bg-bg font-sans text-fg antialiased">
        <LanguageProvider initialLanguage={language}>
          <a href="#main" className="skip-link">
            {t('app.skipToContent')}
          </a>
          <AppProviders>
            <ErrorBoundary>
              <div className="relative min-h-screen overflow-x-hidden bg-bg text-fg">
                <div className="pointer-events-none absolute inset-x-0 top-20 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(var(--color-primary-rgb),0.18),_transparent_65%)]" />
                <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-accent/16 blur-3xl" />
                <div className="pointer-events-none absolute -right-28 bottom-40 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />

                <div className="relative z-10 flex min-h-screen flex-col">
                  <AriaLiveAnnouncer />
                  <WebVitalsReporter />
                  <LandingHeader />
                  <div className="flex-1">{children}</div>
                  <Footer />
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
