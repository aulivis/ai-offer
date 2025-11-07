import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Erőforrások - Vyndi',
  description: 'Hasznos útmutatók, sablonok és cikkek az ajánlatkészítésről',
};

const resources = [
  {
    category: 'Útmutatók',
    items: [
      {
        title: 'Ajánlatkészítési útmutató',
        description: 'Tippek és trükkök a tökéletes ajánlatok elkészítéséhez.',
        href: '/resources/guide',
        type: 'guide',
      },
      {
        title: 'AI-alapú szöveg generálás használata',
        description: 'Tanuld meg, hogyan használd hatékonyan az AI funkciókat.',
        href: '/resources/ai-guide',
        type: 'guide',
      },
    ],
  },
  {
    category: 'Sablonok',
    items: [
      {
        title: 'Ingyenes ajánlat sablonok',
        description: 'Letölthető sablonok különböző iparágakhoz és projekttípusokhoz.',
        href: '/resources/templates',
        type: 'template',
      },
      {
        title: 'Pro sablonok könyvtár',
        description: 'Prémium sablonok Pro előfizetőink számára.',
        href: '/resources/pro-templates',
        type: 'template',
      },
    ],
  },
  {
    category: 'Cikkek',
    items: [
      {
        title: '10 tipp a tökéletes ajánlathoz',
        description: 'Gyakorlati tanácsok, amik segítenek jobb ajánlatokat készíteni.',
        href: '/resources/blog/10-tips',
        type: 'article',
      },
      {
        title: 'Ajánlatkészítés best practices',
        description: 'Iparági best practice-ek és trendek az ajánlatkészítésben.',
        href: '/resources/blog/best-practices',
        type: 'article',
      },
    ],
  },
  {
    category: 'Videók',
    items: [
      {
        title: 'Bevezető videó',
        description: 'Ismerd meg a Vyndi-t 5 percben.',
        href: '/resources/videos/intro',
        type: 'video',
      },
      {
        title: 'Teljes funkció bemutató',
        description: 'Részletes útmutató minden funkcióról.',
        href: '/resources/videos/full-tour',
        type: 'video',
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-6 py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Erőforrások
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Tanulj és fejlődj
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">
          Hozzáférhetsz útmutatókhoz, sablonokhoz, cikkekhez és videókhoz az ajánlatkészítésről.
        </p>
      </div>

      <div className="mt-16 space-y-12">
        {resources.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="mb-6 text-2xl font-semibold text-fg">{category.category}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {category.items.map((resource, resourceIndex) => (
                <Link key={resourceIndex} href={resource.href}>
                  <Card className="group flex h-full flex-col p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {resource.type}
                      </span>
                      <svg
                        className="h-5 w-5 text-fg-muted transition-transform group-hover:translate-x-1 group-hover:text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-fg transition-colors group-hover:text-primary">
                      {resource.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-fg-muted">{resource.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-20">
        <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-fg md:text-4xl">
              {t('landing.resources.ctaTitle')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              {t('landing.resources.ctaDescription')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?redirect=/new"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Ingyenes próba indítása
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

