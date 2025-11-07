'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface Resource {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: 'guide' | 'template' | 'article' | 'video';
}

const resources: Resource[] = [
  {
    title: 'Ajánlatkészítési útmutató',
    description: 'Tippek és trükkök a tökéletes ajánlatok elkészítéséhez.',
    href: '/resources/guide',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    category: 'guide',
  },
  {
    title: 'Ingyenes ajánlat sablonok',
    description: 'Letölthető sablonok különböző iparágakhoz és projekttípusokhoz.',
    href: '/resources/templates',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    category: 'template',
  },
  {
    title: 'Blog és cikkek',
    description: 'Hasznos cikkek az ajánlatkészítésről és az értékesítésről.',
    href: '/resources/blog',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
    ),
    category: 'article',
  },
  {
    title: 'Video útmutatók',
    description: 'Lépésről lépésre videók a Vyndi használatáról.',
    href: '/resources/videos',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    category: 'video',
  },
];

export default function ResourcesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
          Erőforrások
        </span>
        <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
          Tanulj és fejlődj
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
          Hozzáférhetsz útmutatókhoz, sablonokhoz és hasznos tartalmakhoz
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {resources.map((resource, index) => (
          <Link key={index} href={resource.href}>
            <Card className="group flex items-start gap-4 p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                {resource.icon}
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-fg transition-colors group-hover:text-primary">
                  {resource.title}
                </h3>
                <p className="text-sm leading-relaxed text-fg-muted">{resource.description}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  Megnyitás
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/resources"
          className="inline-flex items-center text-base font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Összes erőforrás megtekintése
          <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

