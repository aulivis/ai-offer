'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, ChevronDown, Trophy, Zap, TrendingUp, Star } from 'lucide-react';
import { getCaseStudies } from '@/lib/case-studies';
import { ROICalculatorLanding } from '@/components/roi-calculator-landing';
import { getAuthorImage } from '@/lib/testimonial-images';

// Company logos for showcase (placeholder data)
const customerLogos = [
  { name: 'Tech Solutions Kft.', src: '/logos/tech-solutions.png' },
  { name: 'Creative Agency', src: '/logos/creative-agency.png' },
  { name: 'Studio Fluo', src: '/logos/studio-ikon.png' },
  { name: 'Consulting Group', src: '/logos/consulting-group.png' },
  { name: 'Build Co', src: '/logos/build-co.png' },
  { name: 'Design Studio', src: '/logos/design-studio.png' },
];

export default function SuccessStoriesPage() {
  const caseStudies = getCaseStudies();

  // Generate Schema Markup for CollectionPage
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Vyndi Sikertörténetek',
    description: 'Valós magyar cégek eredményei ajánlatkészítés automatizálással',
    hasPart: caseStudies.map((study) => ({
      '@type': 'CaseStudy',
      name: study.companyName,
      about: study.mainResult,
      sourceOrganization: {
        '@type': 'Organization',
        name: 'Vyndi',
      },
    })),
  };

  // Scroll to stories section
  const scrollToStories = () => {
    const storiesSection = document.getElementById('stories-section');
    if (storiesSection) {
      storiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get CTA link text based on study
  const getCTALinkText = (study: (typeof caseStudies)[0]) => {
    if (study.slug === 'marketing-ugynokseg-sablon-automatizacio') {
      return 'Teljes történet: Gyorsabb sablonok';
    } else if (study.slug === 'tech-solutions') {
      return 'Teljes történet: Hogyan értük el a 65%-ot?';
    } else if (study.slug === 'studio-ikon') {
      return 'Teljes történet: A konverzió növelés titka';
    }
    return 'Teljes történet';
  };

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="min-h-screen bg-white">
        {/* Enhanced Hero Section with Scrolling Logo Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-br from-navy-900 via-navy-800 to-primary text-white relative overflow-hidden min-h-screen flex flex-col -mt-14 md:-mt-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
                <Trophy className="w-4 h-4" />
                Sikertörténetek
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
                Valós eredmények
                <br />
                magyar vállalkozásoktól
              </h1>

              <p className="text-xl md:text-2xl text-primary-ink/80 mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
                Tekintsd meg, hogyan segített a Vyndi{' '}
                <strong>200+ magyar vállalkozásnak 70%-kal gyorsabb ajánlatkészítést</strong> és{' '}
                <strong>35%-kal magasabb konverziót</strong> elérni. Valós esettanulmányok,
                ellenőrzött számok és ügyfélinterjúk.
              </p>

              {/* Scrolling Logo Section */}
              <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                  <strong>Tech Solutions Kft.</strong>, <strong>Creative Agency</strong> és további
                  200+ magyar cég már a Vyndit használja ajánlatkészítésre. Csatlakozz hozzájuk.
                </h2>

                {/* Infinite scrolling logos */}
                <div className="overflow-hidden relative">
                  <div className="flex animate-scroll gap-8 items-center w-max">
                    {/* First set */}
                    {customerLogos.map((logo, idx) => (
                      <div
                        key={`first-${idx}`}
                        className="flex-shrink-0 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                      >
                        <div className="w-32 h-20 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                          <span className="text-xs text-white/80 font-semibold px-4">
                            {logo.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {customerLogos.map((logo, idx) => (
                      <div
                        key={`second-${idx}`}
                        className="flex-shrink-0 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                      >
                        <div className="w-32 h-20 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                          <span className="text-xs text-white/80 font-semibold px-4">
                            {logo.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scroll indicator - moved to bottom */}
              <div className="flex flex-col items-center gap-2 animate-bounce mt-auto pt-8">
                <button
                  onClick={scrollToStories}
                  className="text-white/80 hover:text-white transition-colors flex flex-col items-center gap-2 group"
                  aria-label="Scroll to stories"
                >
                  <span className="text-sm font-medium">📊 Nézd meg a számokat</span>
                  <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies Grid Section */}
        <section id="stories-section" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              {/* Grid Layout for Case Studies */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caseStudies.map((study, index) => {
                  // Alternate gradient colors
                  const gradientClass =
                    index % 3 === 0
                      ? 'from-primary to-accent'
                      : index % 3 === 1
                        ? 'from-accent to-primary'
                        : 'from-success to-primary';

                  // Get primary metrics
                  const primaryMetric = study.metrics[0];
                  const improvementValue = primaryMetric?.improvement?.match(/\d+/)?.[0] || '0';

                  // Get second metric value and label based on study
                  let secondMetricValue = primaryMetric?.after || primaryMetric?.value || 'N/A';
                  let metricLabel = primaryMetric?.label || 'Eredmény';

                  if (study.slug === 'marketing-ugynokseg-sablon-automatizacio') {
                    // For Creative Agency, show the metric value with label "Megtakarítás sablononként"
                    metricLabel = study.metrics[0]?.label || 'Megtakarítás sablononként';
                    secondMetricValue = study.metrics[0]?.after || study.metrics[0]?.value || 'N/A';
                  } else if (study.slug === 'tech-solutions') {
                    // For Tech Solutions, show "Heti szabadidő" from the first metric
                    metricLabel = study.metrics[0]?.label || 'Heti szabadidő';
                    secondMetricValue = study.metrics[0]?.after || study.metrics[0]?.value || 'N/A';
                  } else if (study.slug === 'studio-ikon') {
                    // For Studio Fluo, show the third metric (+35% Konverzió)
                    const conversionMetric = study.metrics[2];
                    secondMetricValue = conversionMetric?.value || '+35%';
                    metricLabel = conversionMetric?.label || 'Konverzió növekedés';
                  }

                  // Split mainResult by | to get company name and subtitle
                  const mainResultParts = study.mainResult.split('|').map((part) => part.trim());
                  const companyNameDisplay = mainResultParts[0] || study.companyName;
                  const subtitleText = mainResultParts[1] || '';

                  return (
                    <div
                      key={study.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative"
                    >
                      {/* Gradient border accent */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
                          index % 3 === 0
                            ? 'from-primary to-accent'
                            : index % 3 === 1
                              ? 'from-accent to-primary'
                              : 'from-success to-primary'
                        }`}
                      />
                      {/* Header with gradient - Mobile optimized */}
                      <div
                        className={`h-24 md:h-32 bg-gradient-to-br ${gradientClass} p-4 md:p-6 relative`}
                      >
                        {/* Trust badge - moved to header, left side */}
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs text-white font-semibold">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-success flex-shrink-0" />
                          <span>Ellenőrzött eredmény</span>
                        </div>
                        {/* Industry badge - right side */}
                        <div className="absolute top-2 right-2 md:top-4 md:right-4">
                          <span className="bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs text-white font-semibold">
                            {study.industryLabel}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mt-6 md:mt-8">
                          {companyNameDisplay}
                        </h3>
                        {subtitleText && (
                          <p className="text-sm md:text-base text-white/90 mt-2">{subtitleText}</p>
                        )}
                      </div>

                      {/* Content section */}
                      <div className="p-4 md:p-6">
                        {/* Key metrics - compact, mobile optimized */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                          <div className="text-center p-2 md:p-3 bg-bg-muted rounded-lg">
                            <div className="text-xl md:text-2xl font-bold text-primary">
                              {improvementValue}%
                            </div>
                            <div className="text-xs text-fg-muted">
                              {study.slug === 'marketing-ugynokseg-sablon-automatizacio'
                                ? 'Időmegtakarítás sablonkészítésben'
                                : study.slug === 'studio-ikon'
                                  ? 'Gyorsabb ajánlatkészítés'
                                  : study.slug === 'tech-solutions'
                                    ? 'Heti szabadidő'
                                    : 'Időmegtakarítás'}
                            </div>
                          </div>
                          <div className="text-center p-2 md:p-3 bg-bg-muted rounded-lg">
                            <div className="text-xl md:text-2xl font-bold text-primary">
                              {secondMetricValue}
                            </div>
                            <div className="text-xs text-fg-muted">{metricLabel}</div>
                          </div>
                        </div>

                        {/* Testimonial - truncated, mobile optimized */}
                        <blockquote className="text-xs md:text-sm text-fg-muted italic line-clamp-2 md:line-clamp-3 mb-4 md:mb-6 border-l-4 border-primary/20 pl-2 md:pl-3">
                          &ldquo;{study.testimonial.quote}&rdquo;
                        </blockquote>

                        {/* Client info - Mobile optimized */}
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
                            <Image
                              src={getAuthorImage(study.testimonial.author)}
                              alt={study.testimonial.author}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              sizes="(max-width: 768px) 32px, 40px"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs md:text-sm truncate">
                              {study.testimonial.author}
                            </div>
                            <div className="text-xs text-fg-muted truncate">
                              {study.testimonial.role}
                            </div>
                          </div>
                        </div>

                        {/* CTA - Mobile optimized */}
                        <Link
                          href={`/sikertortenetek-ajanlatkeszites-automatizalas/${study.slug}`}
                          className="group w-full border-2 border-primary text-primary font-semibold rounded-xl px-8 py-4 min-h-[56px] hover:border-primary/80 hover:text-primary/80 bg-transparent transition-colors flex items-center justify-center text-center"
                        >
                          <span className="text-center">{getCTALinkText(study)}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA After Stories - Moved here */}
        <section className="py-12 bg-gradient-to-r from-bg-muted to-bg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">
                Inspirálódtál? Kezdd el megírni a saját sikertörténetedet még ma!
              </h2>
              <Link
                href="/login?redirect=/new"
                className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-base md:text-lg text-white">
                  Próbáld ki most ingyen
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section>
          <ROICalculatorLanding />
        </section>

        {/* Enhanced Bottom CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary to-accent text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
                200+ magyar vállalkozás már élvezi a Vyndi előnyeit
              </h2>

              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Akik 30 nap alatt átlagosan <strong>110.250 Ft-ot</strong> és{' '}
                <strong>16 órát</strong> spórolnak az ajánlatkészítés automatizálásával
              </p>

              {/* Key benefits */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-[52.8rem] mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-4xl font-bold">70%</div>
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">
                    Gyorsabb ajánlatkészítés
                  </div>
                  <div className="text-xs text-white/80">Átlagos időmegtakarítás</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-4xl font-bold">+35%</div>
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">Konverzió növekedés</div>
                  <div className="text-xs text-white/80">Magasabb megrendelési arány</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-4xl font-bold">98%</div>
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">Ajánlási arány</div>
                  <div className="text-xs text-white/80">Ügyfeleink ajánlanák</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  href="/login?redirect=/new"
                  className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                >
                  <span className="relative z-10 text-base md:text-lg text-white">
                    Csatlakozz Te is → 5 perc alatt kész
                  </span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              </div>

              {/* Trust Indicators - 3 features from landing hero */}
              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Kezdd el teljesen ingyen</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Nem kérünk bankkártyát</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Kész ajánlat 5 perc alatt</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
