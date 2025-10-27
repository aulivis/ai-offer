import './globals.css';
import type { Metadata } from 'next';
import { t } from '@/copy';

import AnnouncementBar from '@/components/AnnouncementBar';
import AnalyticsScriptGate from '@/components/consent/AnalyticsScriptGate';
import CookieBar from '@/components/cookies/CookieBar';
import { PreferencesModal } from '@/components/cookies/PreferencesModal';
import LandingHeader from '@/components/LandingHeader';
import { ToastProvider } from '@/components/ToastProvider';
import { SupabaseProvider } from '@/components/SupabaseProvider';
import Footer from '@/components/layout/Footer';

import { gota, spaceMono, workSans } from './fonts';

export const metadata: Metadata = {
  title: 'Propono — AI offers',
  description: 'AI-assisted, professional offers for SMEs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${workSans.variable} ${gota.variable} ${spaceMono.variable}`}>
      <body className="bg-bg font-sans text-fg antialiased">
        <a href="#main" className="skip-link">
          {t('app.skipToContent')}
        </a>
        <SupabaseProvider>
          <ToastProvider>
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
            </div>
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
