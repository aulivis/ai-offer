'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, ChevronDown } from 'lucide-react';
import { t } from '@/copy';
import { getCaseStudies } from '@/lib/case-studies';
import { getAuthorImage } from '@/lib/testimonial-images';

// Lazy load ROI calculator for route-based code splitting
const ROICalculatorLanding = dynamic(
  () =>
    import('@/components/roi-calculator-landing').then((mod) => mod.ROICalculatorLanding),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);

// Company logos for showcase (placeholder data)
const customerLogos = [
  { name: 'Studio Ikon', src: '/logos/studio-ikon.png' },
  { name: 'Tech Solutions', src: '/logos/tech-solutions.png' },
  { name: 'Creative Agency', src: '/logos/creative-agency.png' },
  { name: 'Consulting Group', src: '/logos/consulting-group.png' },
  { name: 'Build Co', src: '/logos/build-co.png' },
  { name: 'Design Studio', src: '/logos/design-studio.png' },
];

export default function SuccessStoriesPage() {
  const [sortBy, setSortBy] = useState('newest');

  const caseStudies = getCaseStudies();

  const sortedStudies = useMemo(() => {
    let sorted = [...caseStudies];

    // Sort
    if (sortBy === 'newest') {
      sorted = sorted.sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
      );
    } else if (sortBy === 'best-results') {
      // Sort by improvement percentage
      sorted = sorted.sort((a, b) => {
        const aImprovement = a.metrics[0]?.improvement?.match(/\d+/)?.[0] || '0';
        const bImprovement = b.metrics[0]?.improvement?.match(/\d+/)?.[0] || '0';
        return Number(bImprovement) - Number(aImprovement);
      });
    }

    return sorted;
  }, [caseStudies, sortBy]);

  // Scroll to stories section
  const scrollToStories = () => {
    const storiesSection = document.getElementById('stories-section');
    if (storiesSection) {
      storiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section with Scrolling Logo Section */}
      <section className="py-20 lg:py-32 bg-gradient-hero text-white relative overflow-hidden min-h-screen flex flex-col -mt-14 md:-mt-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full font-semibold text-sm mb-6 border border-primary/30">
              {t('landing.successStories.badge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              Valós eredmények
              <br />
              valós ügyfelektől
            </h1>

            <p className="text-xl md:text-2xl text-primary-ink/80 mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
              {t('landing.successStories.description')}
            </p>

            {/* Scrolling Logo Section */}
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-white/90 mb-8">
                Több mint 500 vállalkozás bízik a Vyndi-ben
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
                <span className="text-sm font-medium">Görgess le a történetekhez</span>
                <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA After Hero */}
      <section className="py-12 bg-gradient-to-r from-bg to-bg-muted border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">
              Inspirálódtál? Kezdj el a saját sikertörténetedet még ma
            </h2>
            <Link
              href="/login?redirect=/new"
              className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
            >
              <span className="relative z-10 text-base md:text-lg text-white">
                Próbáld ki most ingyen
              </span>
              <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
              <span className="absolute inset-0 bg-gradient-to-r from-cta to-cta-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* Case Studies Grid Section */}
      <section id="stories-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Sort Option */}
            <div className="flex justify-end mb-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-fg-muted">Rendezés:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px] bg-white"
                >
                  <option value="newest">Legújabb</option>
                  <option value="best-results">Legjobb eredmények</option>
                </select>
              </div>
            </div>

            {/* Grid Layout for Case Studies */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStudies.map((study, index) => {
                // Alternate gradient colors
                const gradientPalette = [
                  'from-primary to-accent',
                  'from-accent to-primary',
                  'from-success to-primary',
                ];
                const gradientClass = gradientPalette[index % gradientPalette.length];

                // Get primary metrics
                const primaryMetric = study.metrics[0];
                const improvementValue = primaryMetric?.improvement?.match(/\d+/)?.[0] || '0';

                return (
                  <div
                    key={study.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative"
                  >
                    {/* Gradient border accent */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientPalette[index % gradientPalette.length]}`}
                    />
                    {/* Header with gradient - Mobile optimized */}
                    <div
                      className={`h-24 md:h-32 bg-gradient-to-br ${gradientClass} p-4 md:p-6 relative`}
                    >
                      <div className="absolute top-2 right-2 md:top-4 md:right-4">
                        <span className="bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs text-white font-semibold">
                          {study.industryLabel}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mt-6 md:mt-8">
                        {study.companyName}
                      </h3>
                    </div>

                    {/* Content section */}
                    <div className="p-4 md:p-6">
                      {/* Key result headline */}
                      <div className="mb-3 md:mb-4">
                        <p className="text-xs md:text-sm font-semibold text-fg line-clamp-2">
                          {study.mainResult}
                        </p>
                      </div>

                      {/* Key metrics - compact, mobile optimized */}
                      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="text-center p-2 md:p-3 bg-bg rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-success">
                            {improvementValue}%
                          </div>
                          <div className="text-xs text-fg-muted">Időmegtakarítás</div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-bg rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-primary">
                            {primaryMetric?.after || primaryMetric?.value || 'N/A'}
                          </div>
                          <div className="text-xs text-fg-muted">
                            {primaryMetric?.label || 'Eredmény'}
                          </div>
                        </div>
                      </div>

                      {/* Testimonial - truncated, mobile optimized */}
                      <blockquote className="text-xs md:text-sm text-fg-muted italic line-clamp-2 md:line-clamp-3 mb-3 md:mb-4 border-l-4 border-primary/30 pl-2 md:pl-3">
                        &ldquo;{study.testimonial.quote}&rdquo;
                      </blockquote>

                      {/* Trust badge - Mobile optimized */}
                      <div className="flex items-center gap-2 text-xs text-fg-muted mb-3 md:mb-4">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-success flex-shrink-0" />
                        <span className="truncate">Ellenőrzött eredmény</span>
                      </div>

                      {/* Client info - Mobile optimized */}
                      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-border">
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
                        href={`/success-stories/${study.slug}`}
                        className="group w-full border-2 border-primary text-primary font-semibold rounded-xl px-8 py-4 min-h-[56px] hover:border-primary/80 hover:text-primary/80 bg-transparent transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Teljes történet</span>
                        <ArrowRight className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inline CTA every 3rd story (after 3, 6, 9...) */}
            {sortedStudies.length > 3 && (
              <div className="mt-12 text-center py-8 bg-gradient-to-r from-bg to-bg-muted rounded-xl border border-primary/20">
                <h3 className="text-xl font-bold text-navy-900 mb-2">
                  Készen állsz hasonló eredmények elérésére?
                </h3>
                <p className="text-fg-muted mb-4">Próbáld ki a Vyndit ingyen</p>
                <Link
                  href="/login?redirect=/new"
                  className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full md:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
                >
                  <span className="relative z-10 text-base md:text-lg text-white">
                    Próbáld ki most ingyen
                  </span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="absolute inset-0 bg-gradient-to-r from-cta to-cta-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section>
        <ROICalculatorLanding />
      </section>

      {/* Enhanced Bottom CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-ink relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
              Csatlakozz 540+ vállalkozáshoz
              <br />
              akik 30 nap alatt eredményeket érnek el
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Átlagosan 70%-kal gyorsabban készítik ajánlataikat és 35%-kal magasabb konverziós
              rátát érnek el
            </p>

            {/* Key benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">70%</div>
                <div className="text-sm text-white/90">gyorsabb ajánlatkészítés</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">+35%</div>
                <div className="text-sm text-white/90">konverziós ráta növekedés</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-sm text-white/90">ajánlanák másoknak</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/login?redirect=/new"
                className="group bg-cta hover:bg-cta-hover text-cta-ink font-semibold rounded-xl px-8 py-4 min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 relative overflow-hidden"
              >
                <span className="relative z-10 text-base md:text-lg text-white">
                  Próbáld ki most ingyen
                </span>
                <ArrowRight className="w-5 h-5 flex-shrink-0 relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-cta to-cta-hover opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
  );
}
