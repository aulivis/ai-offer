import './globals.css';
import type { Metadata } from 'next';
import { t } from '@/copy';

import AnnouncementBar from '@/components/AnnouncementBar';
import AnalyticsScriptGate from '@/components/consent/AnalyticsScriptGate';
import CookieBar from '@/components/cookies/CookieBar';
import { PreferencesModal } from '@/components/cookies/PreferencesModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LandingHeader from '@/components/LandingHeader';
import Footer from '@/components/layout/Footer';
import { AppProviders } from '@/components/AppProviders';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

import { LanguageProvider } from '@/state/LanguageProvider';
import { withLanguage } from '@/state/lang';
import { getRequestLanguage } from './lib/language';

import { gota, spaceMono, workSans } from './fonts';

export const metadata: Metadata = {
  title: 'Propono — AI offers',
  description: 'AI-assisted, professional offers for SMEs',
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
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(var(--color-primary-rgb),0.18),_transparent_65%)]" />
                <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-accent/16 blur-3xl" />
                <div className="pointer-events-none absolute -right-28 bottom-40 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />

                <div className="relative z-10 flex min-h-screen flex-col">
                  <AnnouncementBar />
                  <LandingHeader className="bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60" />
                  <div className="flex-1">{children}</div>
                  <Footer />
                </div>

                <CookieBar />
                <PreferencesModal />
                <AnalyticsScriptGate />
                <ScrollToTop />
              </div>
            </ErrorBoundary>
          </AppProviders>
        </LanguageProvider>
      </body>
    </html>
  ));
}
