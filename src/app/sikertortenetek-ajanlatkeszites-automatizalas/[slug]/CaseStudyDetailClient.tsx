'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Building2,
  Clock,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  FileText,
  TrendingDown,
  TrendingUp,
  Zap,
  Settings,
  Rocket,
  Target,
  Sparkles,
} from 'lucide-react';
import type { CaseStudy } from '@/types/case-study';
import { getRelatedCaseStudies } from '@/lib/case-studies';
import { getAuthorImage } from '@/lib/testimonial-images';

interface CaseStudyDetailClientProps {
  caseStudy: CaseStudy;
}

export function CaseStudyDetailClient({ caseStudy }: CaseStudyDetailClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const relatedCaseStudies = getRelatedCaseStudies(caseStudy.slug, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-6 border-b border-border bg-white">
        <Link
          href="/sikertortenetek-ajanlatkeszites-automatizalas"
          className="inline-flex items-center gap-2 text-fg-muted hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Vissza a sikertörténetekhez</span>
        </Link>
      </div>

      {/* Enhanced Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-navy-900 via-navy-800 to-primary-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Eyebrow text */}
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm border border-turquoise-500/30">
                {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                  ? '📊 ESETTANULMÁNY'
                  : 'SIKERTÖRTÉNET'}
              </span>
            </div>

            {/* Company Context */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              {/* Company logo */}
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center border border-white/20">
                {caseStudy.companyLogo ? (
                  <Image
                    src={caseStudy.companyLogo}
                    alt={caseStudy.companyName}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain p-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-turquoise-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-turquoise-600">
                      {caseStudy.companyName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-white font-semibold text-2xl mb-3">{caseStudy.companyName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                    {caseStudy.industryLabel}
                  </span>
                  <span className="text-fg-muted flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {caseStudy.companySize}
                  </span>
                  <span className="text-fg-muted flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {caseStudy.timeline}
                  </span>
                </div>
              </div>
            </div>

            {/* Main result quote - reduced prominence */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {caseStudy.mainResult}
              </h1>
              <p className="text-lg md:text-xl text-fg-muted max-w-3xl mx-auto">
                {caseStudy.shortDescription}
              </p>
            </div>

            {/* Scroll down button */}
            <div className="flex flex-col items-center gap-2 animate-bounce mt-8">
              <button
                onClick={() => {
                  const metricsSection = document.getElementById('metrics-section');
                  if (metricsSection) {
                    metricsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-2 group"
                aria-label="Scroll to metrics"
              >
                <span className="text-sm font-medium">
                  {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                    ? 'Nézd meg, hogyan csináltuk'
                    : '📊 Nézd meg a számokat'}
                </span>
                <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Metrics Section */}
      <section id="metrics-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
              {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                ? 'Havi 480.000 Ft megtakarítás és 100%-os márkakonzisztencia - Hogyan?'
                : 'Elért eredmények'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {caseStudy.metrics.map((metric, index) => {
                const isPrimary = index === 0;
                const iconMap: Record<number, typeof Clock> = {
                  0: Clock,
                  1: FileText,
                  2:
                    caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                      ? Zap
                      : TrendingDown,
                };
                const Icon = iconMap[index] || Clock;

                // Use static Tailwind classes
                const colorClasses = [
                  { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
                  { bg: 'bg-accent/10', text: 'text-accent', icon: 'text-accent' },
                  { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
                ];
                const colors = colorClasses[index] || colorClasses[0];

                return (
                  <div
                    key={metric.id}
                    className="bg-white rounded-xl p-6 md:p-8 shadow-lg relative overflow-hidden"
                  >
                    {/* Decorative background element */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -mr-16 -mt-16`}
                    ></div>

                    <div className="relative z-10">
                      {/* Icons after numbers - same row for all pages */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`font-bold ${colors.text} ${
                            isPrimary ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                          }`}
                        >
                          {metric.value}
                        </div>
                        <Icon
                          className={`w-6 md:w-8 h-6 md:h-8 ${colors.icon} ${
                            isPrimary ? 'md:w-10 md:h-10' : ''
                          }`}
                        />
                      </div>
                      <div
                        className={`font-semibold mb-1 ${
                          isPrimary ? 'text-lg' : 'text-base'
                        } text-fg-muted`}
                      >
                        {metric.label}
                      </div>
                      <div className={`text-fg-muted ${isPrimary ? 'text-sm' : 'text-xs'}`}>
                        {metric.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Challenge Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio' ? (
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-6">
                  A Kihívás: &quot;Egy hétvége alatt 5 ajánlat - lehetetlen&quot;
                </h2>

                <div className="story-content">
                  <p className="text-lg text-fg-muted leading-relaxed mb-6">
                    2024. januárjában Szabó Anna, a Creative Agency projektmenedzsere azzal a
                    problémával küzdött, hogy egy nagy kampányhoz 5 komplex ajánlatot kellett volna
                    készíteniük 3 nap alatt. A csapat már teljes kapacitáson dolgozott.
                  </p>

                  <div className="pain-points mb-6">
                    <h3 className="font-bold text-xl text-navy-900 mb-4">A fájdalmas valóság:</h3>
                    <ul className="space-y-3">
                      {caseStudy.challengePoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                          <span
                            className="text-fg-muted"
                            dangerouslySetInnerHTML={{ __html: point }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>

                  <blockquote className="border-l-4 border-danger pl-6 py-4 bg-danger/10 rounded-r-lg my-6">
                    <p className="text-fg-muted italic mb-2">
                      &quot;Az egyik ügyfél visszaküldte az ajánlatot, mert &apos;nem nézett ki
                      professzionálisan&apos;. Pedig a tartalom tökéletes volt. A dizájn rombolt meg
                      mindent.&quot;
                    </p>
                    <footer className="text-fg-muted font-semibold">- Szabó Anna</footer>
                  </blockquote>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-8 h-8 text-danger" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">A kihívás</h2>
                    <p className="text-lg text-fg-muted leading-relaxed">{caseStudy.challenge}</p>
                  </div>
                </div>

                {/* Challenge details with better spacing */}
                <div className="space-y-4">
                  {caseStudy.challengePoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-fg">{point}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Solution Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio' ? (
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-6">
                  A Megoldás: &quot;Egy héten belül 5 sablon, 0 túlóra&quot;
                </h2>

                <div className="solution-story">
                  <p className="text-lg text-fg-muted leading-relaxed mb-6">
                    Anna először szkeptikus volt. &quot;Már megpróbáltunk sablonrendszert, de sose
                    működött.&quot; Aztán látta a Vyndi <strong>moduláris megoldását</strong> és a{' '}
                    <strong>AI szövegvarázslót</strong>.
                  </p>

                  <div className="implementation-steps space-y-6">
                    {caseStudy.implementationSteps.map((step, idx) => {
                      const weekLabels = ['1. Hét', '2-4. Hét', '6. Hét'];
                      const outcomeLabels = [
                        '✅ 5 sablon kész, 0 túlóra',
                        '✅ 50% időmegtakarítás',
                        '✅ 70% gyorsulás',
                      ];
                      return (
                        <div
                          key={idx}
                          className="step bg-primary/10 rounded-lg p-6 border border-primary/30"
                        >
                          <div className="week bg-primary-ink text-white px-3 py-1 rounded-full text-sm font-semibold inline-block mb-3">
                            {weekLabels[idx] || step.title}
                          </div>
                          <h3 className="font-bold text-xl text-navy-900 mb-2">{step.title}</h3>
                          <p className="text-fg-muted mb-3">{step.description}</p>
                          <div className="outcome bg-success text-white px-4 py-2 rounded-lg inline-block text-sm font-semibold">
                            {outcomeLabels[idx] || ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <blockquote className="border-l-4 border-primary/40 pl-6 py-4 bg-primary/10 rounded-r-lg my-6">
                    <p className="text-fg-muted italic mb-2">
                      &quot;Az a pillanat, amikor az egyik designer azt mondta: &apos;Most végre a
                      kreatív munkára tudok koncentrálni, a sablonozást hagyom a robotra.&apos;
                      Akkor tudtam, hogy ez működik.&quot;
                    </p>
                    <footer className="text-fg-muted font-semibold">- Szabó Anna</footer>
                  </blockquote>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">
                      A megoldás
                    </h2>
                    <p className="text-lg text-fg-muted leading-relaxed">{caseStudy.solution}</p>
                  </div>
                </div>

                {/* Solution features used */}
                <div className="space-y-3">
                  <h3 className="font-bold text-navy-900 mb-4 text-lg">Használt Vyndi funkciók:</h3>
                  {caseStudy.featuresUsed.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-teal-100"
                    >
                      <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                      <span className="text-fg-muted">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Visual Timeline */}
      <section
        className="py-16 bg-gradient-to-b from-bg-muted to-white"
        aria-label="Eredmények idővonalon"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
              {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                ? '2 Hónap, 4 Mérföldkő - Így Értük El'
                : 'Eredmények idővonalon'}
            </h2>

            {/* Vertical Timeline */}
            <ol className="relative pl-8 md:pl-0 list-none">
              {/* Vertical line - more prominent with gradient */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary-ink to-primary-ink/90 transform md:-translate-x-1/2 rounded-full shadow-sm"></div>

              {/* Timeline items */}
              <div className="space-y-12">
                {caseStudy.resultTimeline.map((milestone, idx) => {
                  // Determine icon based on milestone type
                  const getMilestoneIcon = () => {
                    const title = milestone.title.toLowerCase();
                    if (
                      title.includes('onboarding') ||
                      title.includes('beállítás') ||
                      title.includes('létrehozás')
                    ) {
                      return Settings;
                    }
                    if (
                      title.includes('átállás') ||
                      title.includes('tanulás') ||
                      title.includes('fejlesztés')
                    ) {
                      return Rocket;
                    }
                    if (
                      title.includes('maximális') ||
                      title.includes('teljes') ||
                      title.includes('hatékonyság')
                    ) {
                      return Target;
                    }
                    return Sparkles;
                  };

                  const MilestoneIcon = getMilestoneIcon();

                  return (
                    <li key={idx} className="relative flex items-start gap-6 md:gap-8 group">
                      {/* Timeline dot and connector */}
                      <div className="relative flex-shrink-0 z-10">
                        {/* Timeline dot with checkmark for completed stages */}
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary/100 to-primary-ink/90 flex items-center justify-center shadow-xl ring-4 ring-white relative z-10 transform -translate-x-3 md:-translate-x-1/2 -translate-y-1/2 top-0 group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle
                            className="w-6 h-6 md:w-7 md:h-7 text-white"
                            strokeWidth={2.5}
                          />
                        </div>
                        {/* Week badge - mobile only, positioned above */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 md:hidden">
                          <span className="text-xs font-semibold text-primary bg-white px-2 py-1 rounded-full shadow-sm border border-primary/40">
                            {milestone.week}
                          </span>
                        </div>
                      </div>

                      {/* Content card */}
                      <div className="flex-1 pt-1">
                        <article className="bg-white rounded-xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary/40 group max-w-2xl mx-auto hover:-translate-y-1">
                          {/* Week and period header - unified formatting for all pages */}
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30/60">
                              {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                                ? milestone.week === '1'
                                  ? 'Január 1. hét'
                                  : milestone.week === '2-4'
                                    ? 'Január 2-4. hét'
                                    : milestone.week === '6'
                                      ? 'Február 6. hét'
                                      : milestone.week === '8'
                                        ? 'Február vége'
                                        : milestone.week
                                : `${milestone.period}`}
                            </span>
                          </div>

                          {/* Title with icon */}
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <MilestoneIcon className="w-5 h-5 text-primary flex-shrink-0" />
                            <h3 className="font-bold text-xl md:text-2xl text-navy-900 group-hover:text-primary transition-colors text-center">
                              {milestone.title}
                            </h3>
                          </div>

                          {/* Description */}
                          <p className="text-sm md:text-base text-fg-muted leading-relaxed mb-6 text-center">
                            {milestone.description.includes(
                              'Minden új ajánlatot a Vyndi-vel készítettek',
                            )
                              ? milestone.description.replace(
                                  'Minden új ajánlatot a Vyndi-vel készítettek',
                                  'Minden új ajánlatot a Vyndi-vel készítettünk',
                                )
                              : milestone.description}
                          </p>

                          {/* Enhanced Outcome Metrics */}
                          {milestone.metrics && (
                            <div className="flex justify-center">
                              <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-br from-green-500 to-primary-ink/90 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-green-400/30 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  {/* Use TrendingUp for last milestone, TrendingDown for others */}
                                  {idx === caseStudy.resultTimeline.length - 1 ? (
                                    <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
                                  ) : (
                                    <TrendingDown className="w-5 h-5" strokeWidth={2.5} />
                                  )}
                                  <span className="text-xs uppercase tracking-wide opacity-90">
                                    Eredmény
                                  </span>
                                </div>
                                <span className="text-base md:text-lg text-center leading-tight">
                                  {milestone.metrics}
                                </span>
                              </div>
                            </div>
                          )}
                        </article>
                      </div>
                    </li>
                  );
                })}
              </div>
            </ol>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonial Section */}
      <section className="py-16 bg-gradient-to-br from-primary/100 to-accent text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Decorative quote mark - closer to text */}
            <div className="text-white/20 text-7xl md:text-9xl font-serif mb-4 -ml-4">&ldquo;</div>

            {/* Quote text - break into paragraphs */}
            <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8 max-w-4xl">
              {caseStudy.testimonial.fullQuote
                .split(/\n+/)
                .filter(Boolean)
                .map((paragraph, idx) => (
                  <p key={idx} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
            </blockquote>

            {/* Client info - more prominent */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0">
                <Image
                  src={getAuthorImage(caseStudy.testimonial.author)}
                  alt={caseStudy.testimonial.author}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-lg">{caseStudy.testimonial.author}</div>
                <div className="text-white/80">{caseStudy.testimonial.role}</div>
                <div className="text-white/70 text-sm">{caseStudy.companyName}</div>
              </div>

              {/* Verified badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4 text-success/70" />
                Ellenőrzött
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced FAQ Section - Accordion Style */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-navy-900 mb-8">
              Hogyan történt a megvalósítás?
            </h2>

            <div className="space-y-3">
              {caseStudy.implementationSteps.map((step, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx + 1 ? null : idx + 1)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-fg text-lg">{step.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        openFaq === idx + 1 ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openFaq === idx + 1 && (
                    <div className="px-6 pb-6 text-fg-muted leading-relaxed ml-12">
                      {step.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Related Case Studies */}
      {relatedCaseStudies.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
                {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                  ? 'Hasonló cégek, akik így növekednek'
                  : 'Hasonló sikertörténetek'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedCaseStudies.map((related, index) => {
                  // Use static Tailwind classes
                  const gradients = [
                    'from-purple-400 to-pink-600',
                    'from-blue-400 to-indigo-600',
                    'from-primary to-cyan-600',
                  ];
                  const gradient = gradients[index % 3] || 'from-primary to-accent';
                  const primaryMetric = related.metrics[0];
                  const improvementValue = primaryMetric?.improvement?.match(/\d+/)?.[0] || '0';

                  return (
                    <Link
                      key={related.slug}
                      href={`/sikertortenetek-ajanlatkeszites-automatizalas/${related.slug}`}
                      className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                    >
                      {/* Gradient header */}
                      <div className={`h-24 bg-gradient-to-br ${gradient} relative`}>
                        <div className="absolute bottom-4 left-6">
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold">
                            {related.industryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h4 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                          {related.companyName}
                        </h4>
                        <p className="text-sm text-fg-muted mb-4 line-clamp-2">
                          {related.shortDescription}
                        </p>

                        {/* Key metric highlight */}
                        {primaryMetric && (
                          <div className="flex gap-4 mb-4">
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-primary">
                                {improvementValue}%
                              </div>
                              <div className="text-xs text-fg-muted">Javulás</div>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-accent">
                                {primaryMetric.value}
                              </div>
                              <div className="text-xs text-fg-muted">{primaryMetric.label}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20">
                              <Image
                                src={getAuthorImage(related.testimonial.author)}
                                alt={related.testimonial.author}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-xs">
                              <div className="font-semibold">{related.testimonial.author}</div>
                              <div className="text-fg-muted">{related.testimonial.role}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Back to Stories Link - Removed for all pages */}

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-accent/100 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                ? 'Legyen a Te céged a következő sikertörténet?'
                : 'Érj el hasonló eredményeket'}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {caseStudy.slug === 'marketing-ugynokseg-sablon-automatizacio'
                ? 'Próbáld ki a Vyndi-t ingyen és készítsd el az első ajánlatod 5 perc alatt. Nincs bankkártya, nincs kockázat.'
                : `Csatlakozz ${caseStudy.companyName}-hoz és 500+ céghez, akik már átlagosan 70%-kal gyorsabban készítik ajánlataikat`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/new"
                className="group bg-accent hover:bg-accent-strong text-white font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-base md:text-lg text-white">
                  Próbáld ki most ingyen
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-accent-strong to-warning-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            </div>
            {/* Trust Indicators - 3 features from landing hero */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success/70" />
                <span>Kezdd el teljesen ingyen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success/70" />
                <span>Nem kérünk bankkártyát</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success/70" />
                <span>Kész ajánlat 5 perc alatt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA - Removed for all pages */}
    </div>
  );
}
