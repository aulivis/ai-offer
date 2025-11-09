import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import CaseStudyCard from '@/components/landing/CaseStudyCard';
import { t } from '@/copy';

export const metadata = {
  title: 'Sikertörténetek - Vyndi',
  description: 'Nézd meg, hogyan segítettünk más vállalatoknak növelni az ajánlatkészítési hatékonyságukat',
};

function getCaseStudies() {
  return [
    {
      company: t('landing.caseStudiesInline.studioFluo.company'),
      industry: t('landing.caseStudiesInline.studioFluo.industry'),
      challenge: t('landing.caseStudiesInline.studioFluo.challenge'),
      solution: t('landing.caseStudiesInline.studioFluo.solution'),
      results: [
        { metric: t('landing.caseStudiesInline.studioFluo.results.timeSaved'), value: '70%' },
        { metric: t('landing.caseStudiesInline.studioFluo.results.offersPerWeek'), value: '25+' },
        { metric: t('landing.caseStudiesInline.studioFluo.results.acceptanceRate'), value: '+35%' },
      ],
      quote: t('landing.caseStudiesInline.studioFluo.quote'),
      author: t('landing.caseStudiesInline.studioFluo.author'),
      role: t('landing.caseStudiesInline.studioFluo.role'),
    },
    {
      company: t('landing.caseStudiesInline.techSolutions.company'),
      industry: t('landing.caseStudiesInline.techSolutions.industry'),
      challenge: t('landing.caseStudiesInline.techSolutions.challenge'),
      solution: t('landing.caseStudiesInline.techSolutions.solution'),
      results: [
        { metric: t('landing.caseStudiesInline.techSolutions.results.offerTime'), value: '-65%' },
        { metric: t('landing.caseStudiesInline.techSolutions.results.templatesCount'), value: '50+' },
        { metric: t('landing.caseStudiesInline.techSolutions.results.satisfaction'), value: '98%' },
      ],
      quote: t('landing.caseStudiesInline.techSolutions.quote'),
      author: t('landing.caseStudiesInline.techSolutions.author'),
      role: t('landing.caseStudiesInline.techSolutions.role'),
    },
    {
      company: t('landing.caseStudiesInline.creativeAgency.company'),
      industry: t('landing.caseStudiesInline.creativeAgency.industry'),
      challenge: t('landing.caseStudiesInline.creativeAgency.challenge'),
      solution: t('landing.caseStudiesInline.creativeAgency.solution'),
      results: [
        { metric: t('landing.caseStudiesInline.creativeAgency.results.templateTime'), value: '-80%' },
        { metric: t('landing.caseStudiesInline.creativeAgency.results.consistentAppearance'), value: '100%' },
        { metric: t('landing.caseStudiesInline.creativeAgency.results.offersPerMonth'), value: '40+' },
      ],
      quote: t('landing.caseStudiesInline.creativeAgency.quote'),
      author: t('landing.caseStudiesInline.creativeAgency.author'),
      role: t('landing.caseStudiesInline.creativeAgency.role'),
    },
  ];
}

export default function SuccessStoriesPage() {
  const caseStudies = getCaseStudies();

  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-6 pb-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl pt-16 pb-16 text-center md:pt-24 md:pb-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          {t('landing.successStories.badge')}
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg md:text-5xl lg:text-6xl">
          {t('landing.successStories.title')}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-fg-muted md:text-xl md:leading-relaxed">
          {t('landing.successStories.description')}
        </p>
      </section>

      {/* Case Studies Grid - 2 columns on large screens, 1 on mobile */}
      <div className="mt-12 grid gap-8 md:gap-10 lg:grid-cols-2 lg:gap-12">
        {caseStudies.map((study, index) => (
          <div
            key={index}
            className="transform transition-all duration-300 hover:scale-[1.02]"
          >
            <CaseStudyCard
              company={study.company}
              industry={study.industry}
              challenge={study.challenge}
              solution={study.solution}
              results={study.results}
              quote={study.quote}
              author={study.author}
              role={study.role}
            />
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-24 md:mt-28">
        <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-10 shadow-xl md:p-14">
          {/* Decorative background elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-fg md:text-4xl lg:text-5xl">
              {t('landing.successStories.ctaTitle')}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-fg-muted md:text-xl md:leading-relaxed">
              {t('landing.successStories.ctaDescription')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login?redirect=/new"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('landing.successStories.ctaButton')}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-full border-2 border-primary/60 bg-transparent px-8 py-4 text-base font-semibold text-fg transition-all duration-200 hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('landing.successStories.viewPackages')}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

