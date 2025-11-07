'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

const resources = [
  {
    category: 'Útmutatók',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    items: [
      {
        title: 'Ajánlatkészítési útmutató',
        description: 'Tippek és trükkök a tökéletes ajánlatok elkészítéséhez.',
        href: '/resources',
        type: 'guide',
      },
      {
        title: 'AI-alapú szöveg generálás használata',
        description: 'Tanuld meg, hogyan használd hatékonyan az AI funkciókat.',
        href: '/resources',
        type: 'guide',
      },
    ],
  },
  {
    category: 'Sablonok',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    items: [
      {
        title: 'Ingyenes ajánlat sablonok',
        description: 'Letölthető sablonok különböző iparágakhoz és projekttípusokhoz.',
        href: '/resources',
        type: 'template',
      },
      {
        title: 'Pro sablonok könyvtár',
        description: 'Prémium sablonok Pro előfizetőink számára.',
        href: '/resources',
        type: 'template',
      },
    ],
  },
  {
    category: 'Cikkek',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    items: [
      {
        title: '10 tipp a tökéletes ajánlathoz',
        description: 'Gyakorlati tanácsok, amik segítenek jobb ajánlatokat készíteni.',
        href: '/resources',
        type: 'article',
      },
      {
        title: 'Ajánlatkészítés best practices',
        description: 'Iparági best practice-ek és trendek az ajánlatkészítésben.',
        href: '/resources',
        type: 'article',
      },
    ],
  },
  {
    category: 'Videók',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    items: [
      {
        title: 'Bevezető videó',
        description: 'Ismerd meg a Vyndi-t 5 percben.',
        href: '/resources',
        type: 'video',
      },
      {
        title: 'Teljes funkció bemutató',
        description: 'Részletes útmutató minden funkcióról.',
        href: '/resources',
        type: 'video',
      },
    ],
  },
];

export default function ResourcesPage() {
  const { status } = useOptionalAuth();
  const isAuthenticated = status === 'authenticated';

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-6 pb-24">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-4xl pt-16 pb-20 text-center md:pt-24 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl opacity-30" />
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Erőforrások
        </span>
        <h1 className="mt-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
          Tanulj és fejlődj
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-fg-muted">
          Hozzáférhetsz útmutatókhoz, sablonokhoz, cikkekhez és videókhoz az ajánlatkészítésről.
        </p>
      </section>

      {/* Resources Grid */}
      <div className="mt-20 space-y-16">
        {resources.map((category, categoryIndex) => (
          <div key={categoryIndex} className="relative">
            {/* Category Header */}
            <div className="mb-8 flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                {category.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-fg">{category.category}</h2>
                <div className={`mt-1 h-1 w-16 rounded-full bg-gradient-to-r ${category.color}`} />
              </div>
            </div>

            {/* Resource Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {category.items.map((resource, resourceIndex) => (
                <Link key={resourceIndex} href={resource.href}>
                  <Card className="group relative flex h-full flex-col overflow-hidden border-2 border-border/60 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl">
                    {/* Decorative gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="mb-4 flex items-center justify-between">
                        <span className={`rounded-full ${category.bgColor} px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700`}>
                          {t(`landing.resources.types.${resource.type}` as 'landing.resources.types.guide' | 'landing.resources.types.template' | 'landing.resources.types.article' | 'landing.resources.types.video')}
                        </span>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${category.color} text-white shadow-md transition-transform group-hover:scale-110 group-hover:shadow-lg`}>
                          <svg
                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-fg transition-colors group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent">
                        {resource.title}
                      </h3>
                      <p className="flex-1 text-base leading-relaxed text-fg-muted">{resource.description}</p>
                      
                      {/* Hover indicator */}
                      <div className={`mt-4 h-1 w-0 rounded-full bg-gradient-to-r ${category.color} transition-all duration-300 group-hover:w-full`} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced CTA Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
      <div className="mt-24">
        <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-8 md:p-12 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/20 p-3">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-fg md:text-5xl">
              {t('landing.resources.ctaTitle')}
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-fg-muted">
              {t('landing.resources.ctaDescription')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?redirect=/new"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-accent px-10 py-5 text-base font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
              >
                <span>Ingyenes próba indítása</span>
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-fg-muted">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ingyenes próba</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Nincs bankkártya szükséges</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Azonnali hozzáférés</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}
    </main>
  );
}

