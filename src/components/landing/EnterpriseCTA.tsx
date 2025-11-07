'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';

export default function EnterpriseCTA() {
  const features = [
    t('landing.enterprise.features.0'),
    t('landing.enterprise.features.1'),
    t('landing.enterprise.features.2'),
    t('landing.enterprise.features.3'),
    t('landing.enterprise.features.4'),
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {t('landing.enterprise.badge')}
            </span>
            <h2 className="mt-4 text-3xl font-bold text-fg md:text-4xl">
              {t('landing.enterprise.title')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              {t('landing.enterprise.description')}
            </p>
            <ul className="mt-6 space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-base text-fg">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="mailto:info@vyndi.com?subject=Enterprise megoldás érdeklődés"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                {t('landing.enterprise.ctaPrimary')}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-base font-semibold text-fg transition-all duration-200 hover:border-primary hover:text-primary"
              >
                {t('landing.enterprise.ctaSecondary')}
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-primary/20" />
                      <div className="h-3 w-1/2 rounded bg-primary/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

