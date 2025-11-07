'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';

interface UseCase {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  href: string;
}

const useCases: UseCase[] = [
  {
    title: 'Kreatív ügynökségek',
    description: 'Gyors, professzionális ajánlatok ügyfeleknek egységes márkaidentitással.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
    features: ['Márkázott PDF export', 'AI-alapú szöveg generálás', 'Gyors sablonváltás'],
    cta: 'Próbáld ki ügynökségeknek',
    href: '/new',
  },
  {
    title: 'IT szolgáltatók',
    description: 'Technikai ajánlatok és részletes árkalkulációk komplex projektekhez.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
    features: ['Moduláris blokkrendszer', 'Tételes árkalkuláció', 'Technikai leírások'],
    cta: 'Kezdd el IT projektekhez',
    href: '/new',
  },
  {
    title: 'Konzultánsok és freelancerek',
    description: 'Egyszerű, hatékony ajánlatkészítés egyedülálló projektekhez.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    features: ['Gyors ajánlatkészítés', 'Professzionális megjelenés', 'Könnyű megosztás'],
    cta: 'Próbáld ki freelancerként',
    href: '/new',
  },
];

export default function UseCasesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
          Használati esetek
        </span>
        <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
          Minden iparághoz megfelelő megoldás
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
          A Vyndi-t különböző iparágakban használják a hatékony ajánlatkészítéshez
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {useCases.map((useCase, index) => (
          <Card
            key={index}
            className="group relative flex h-full flex-col p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              {useCase.icon}
            </div>
            <h3 className="mb-3 text-xl font-semibold text-fg">{useCase.title}</h3>
            <p className="mb-6 text-base leading-relaxed text-fg-muted">{useCase.description}</p>

            <ul className="mb-6 flex-1 space-y-2">
              {useCase.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-fg-muted">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={useCase.href}
              className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-fg transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              {useCase.cta}
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

