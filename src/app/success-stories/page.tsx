import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import CaseStudyCard from '@/components/landing/CaseStudyCard';
import { t } from '@/copy';

export const metadata = {
  title: 'Sikertörténetek - Vyndi',
  description: 'Nézd meg, hogyan segítettünk más vállalatoknak növelni az ajánlatkészítési hatékonyságukat',
};

const caseStudies = [
  {
    company: 'Studio Fluo',
    industry: 'Kreatív ügynökség',
    challenge:
      'A csapat hetente 15-20 ajánlatot készített, és mindegyik 4-6 órát vett igénybe. A dizájn inkonzisztens volt, és a csapat tagjai nem tudtak hatékonyan együttműködni.',
    solution:
      'A Vyndi bevezetése után az ajánlatkészítési idő 70%-kal csökkent. Az AI segítségével gyorsan generáltak szövegeket, és a márkázott PDF-ek automatikusan készültek.',
    results: [
      { metric: 'Időmegtakarítás', value: '70%' },
      { metric: 'Ajánlatok/hét', value: '25+' },
      { metric: 'Elfogadási arány', value: '+35%' },
    ],
    quote:
      'A Vyndi megváltoztatta, hogyan dolgozunk. Most már percek alatt készítünk professzionális ajánlatokat, és az ügyfeleink is észrevették a különbséget.',
    author: 'Kiss Júlia',
    role: 'Ügynökségvezető',
  },
  {
    company: 'Tech Solutions Kft.',
    industry: 'IT szolgáltatás',
    challenge:
      'A technikai ajánlatok összetettek voltak, és sok időt vettek igénybe. A különböző projektekhez különböző sablonokra volt szükség, és nehéz volt követni az ajánlatok státuszát.',
    solution:
      'A Vyndi moduláris blokkrendszere lehetővé tette a gyors testreszabást, az AI segített a technikai leírások generálásában, és a valós idejű státusz követés segített a projektmenedzsmentben.',
    results: [
      { metric: 'Ajánlatkészítési idő', value: '-65%' },
      { metric: 'Sablonok száma', value: '50+' },
      { metric: 'Ügyfél elégedettség', value: '98%' },
    ],
    quote:
      'Az AI-alapú szöveg generálás és a moduláris rendszer lehetővé tette, hogy gyorsan és pontosan válaszoljunk az ügyfelek kéréseire.',
    author: 'Nagy Péter',
    role: 'Üzletfejlesztési vezető',
  },
  {
    company: 'Creative Agency',
    industry: 'Marketing ügynökség',
    challenge:
      'A marketing kampányokhoz rendszeresen kellett ajánlatokat készíteni, de a sablonok nehezen testreszabhatók voltak, és a vizuális megjelenés nem volt konzisztens.',
    solution:
      'A Vyndi sablonkönyvtára és márkaidentitás-kezelése lehetővé tette, hogy gyorsan, egységes megjelenéssel készítsenek ajánlatokat. Az AI segítségével a marketing szövegek is gyorsan elkészültek.',
    results: [
      { metric: 'Sablon készítési idő', value: '-80%' },
      { metric: 'Konzisztens megjelenés', value: '100%' },
      { metric: 'Ajánlatok/hónap', value: '40+' },
    ],
    quote:
      'A Vyndi segített, hogy minden ajánlatunk profi megjelenésű legyen, miközben jelentősen csökkent az elkészítésük ideje.',
    author: 'Szabó Anna',
    role: 'Projektmenedzser',
  },
];

export default function SuccessStoriesPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl px-6 py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Sikertörténetek
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Valós eredmények valós ügyfelektől
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">
          Nézd meg, hogyan segítettünk más vállalatoknak növelni az ajánlatkészítési hatékonyságukat és
          javítani az üzleti eredményeiket.
        </p>
      </div>

      <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study, index) => (
          <CaseStudyCard
            key={index}
            company={study.company}
            industry={study.industry}
            challenge={study.challenge}
            solution={study.solution}
            results={study.results}
            quote={study.quote}
            author={study.author}
            role={study.role}
          />
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-20">
        <Card className="overflow-hidden border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-fg md:text-4xl">
              {t('landing.successStories.ctaTitle')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              {t('landing.successStories.ctaDescription')}
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
              <Link
                href="/billing"
                className="inline-flex items-center justify-center rounded-full border-2 border-border px-8 py-4 text-base font-semibold text-fg transition-all duration-200 hover:border-primary hover:text-primary"
              >
                Csomagok megtekintése
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

