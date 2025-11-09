import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';
import { getRequestLanguage } from './lib/language';
import { withLanguage } from '@/state/lang.server';

export const metadata = {
  title: '404 - Az oldal nem található | Vyndi',
  description: 'A keresett oldal nem található.',
};

export default async function NotFound() {
  const language = await getRequestLanguage();

  return withLanguage(language, () => (
    <main id="main" className="mx-auto flex min-h-[80vh] w-full max-w-7xl items-center justify-center px-6 py-20">
      <div className="w-full max-w-4xl">
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white via-slate-50/50 to-primary/5 p-8 md:p-12 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          <div className="relative z-10">
            <div className="flex flex-col items-center text-center lg:flex-row lg:text-left">
              {/* Left side - Illustration/Icon */}
              <div className="mb-8 flex-shrink-0 lg:mb-0 lg:mr-12">
                <div className="relative">
                  {/* Large 404 number with gradient */}
                  <div className="relative">
                    <h1 className="text-9xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-primary md:text-[12rem]">
                      404
                    </h1>
                    <div className="absolute inset-0 text-9xl font-black leading-none text-primary/10 blur-2xl md:text-[12rem]">
                      404
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -right-8 top-8 h-16 w-16 animate-pulse rounded-full bg-primary/20 blur-xl" />
                  <div className="absolute -bottom-4 -left-4 h-12 w-12 animate-pulse rounded-full bg-accent/20 blur-xl delay-300" />
                </div>
              </div>

              {/* Right side - Content */}
              <div className="flex-1 space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t('app.notFound.title')}
                  </span>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl">
                    {t('app.notFound.heading')}
                  </h2>
                  <p className="text-lg leading-relaxed text-slate-600 md:text-xl">
                    {t('app.notFound.description')}
                  </p>
                </div>

                {/* Suggestions */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                    {t('app.notFound.suggestions.title')}
                  </h3>
                  <ul className="space-y-3 text-left">
                    {[
                      t('app.notFound.suggestions.items.0'),
                      t('app.notFound.suggestions.items.1'),
                      t('app.notFound.suggestions.items.2'),
                    ].map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="mt-1 h-5 w-5 flex-shrink-0 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-slate-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {t('app.notFound.ctaHome')}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-bg px-7 py-3 text-base font-semibold text-fg transition-all duration-200 hover:border-primary hover:bg-bgMuted hover:scale-105 active:scale-95"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('app.notFound.ctaDashboard')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom decorative logo/brand */}
            <div className="mt-12 flex items-center justify-center border-t border-slate-200/50 pt-8">
              <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
                <div className="relative h-10 w-10">
                  <Image
                    src="/vyndi-logo.png"
                    alt="Vyndi"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-lg font-bold text-slate-900 transition-colors group-hover:text-primary">
                  Vyndi
                </span>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  ));
}

