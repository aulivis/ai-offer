'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Search, Quote, MessageCircle, Check } from 'lucide-react';
import { t } from '@/copy';
import { getCaseStudies } from '@/lib/case-studies';
import { CaseStudy } from '@/types/case-study';
import { MetricComparison } from '@/components/case-study-metric-comparison';
import { ROICalculator } from '@/components/roi-calculator';
import { CaseStudyFiltersComponent, CaseStudyFilters } from '@/components/case-study-filters';
import { getAuthorImage } from '@/lib/testimonial-images';

// Company logos for showcase (placeholder data)
const customerLogos = [
  { name: 'Studio Ikon', src: '/logos/studio-ikon.png' },
  { name: 'Tech Solutions', src: '/logos/tech-solutions.png' },
  { name: 'Creative Agency', src: '/logos/creative-agency.png' },
  { name: 'Consulting Group', src: '/logos/consulting-group.png' },
  { name: 'Build Co', src: '/logos/build-co.png' },
  { name: 'Design Studio', src: '/logos/design-studio.png' },
];

function filterCaseStudies(
  studies: CaseStudy[],
  filters: CaseStudyFilters,
  searchQuery: string,
): CaseStudy[] {
  return studies.filter((study) => {
    // Industry filter
    const matchesIndustry = filters.industry === 'all' || study.industry === filters.industry;

    // Company size filter (placeholder - would need to be in data)
    const matchesCompanySize = filters.companySize === 'all' || true;

    // Results type filter (placeholder - would need metrics analysis)
    const matchesResultsType = filters.resultsType === 'all' || true;

    // Use case filter (placeholder - would need to be in data)
    const matchesUseCase = filters.useCase === 'all' || true;

    // Search query
    const matchesSearch =
      study.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.industryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchesIndustry && matchesCompanySize && matchesResultsType && matchesUseCase && matchesSearch
    );
  });
}

export default function SuccessStoriesPage() {
  const [filters, setFilters] = useState<CaseStudyFilters>({
    industry: 'all',
    companySize: 'all',
    resultsType: 'all',
    useCase: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const caseStudies = getCaseStudies();

  const filteredStudies = useMemo(() => {
    let filtered = filterCaseStudies(caseStudies, filters, searchQuery);

    // Sort
    if (sortBy === 'newest') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
      );
    } else if (sortBy === 'best-results') {
      // Sort by improvement percentage (placeholder logic)
      filtered = [...filtered].sort((a, b) => {
        const aImprovement = a.metrics[0]?.improvement?.match(/\d+/)?.[0] || '0';
        const bImprovement = b.metrics[0]?.improvement?.match(/\d+/)?.[0] || '0';
        return Number(bImprovement) - Number(aImprovement);
      });
    }

    return filtered;
  }, [caseStudies, filters, searchQuery, sortBy]);

  const featuredStudies = filteredStudies.filter((s) => s.featured);
  const regularStudies = filteredStudies.filter((s) => !s.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
              {t('landing.successStories.badge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              Valós eredmények
              <br />
              valós ügyfelektől
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
              {t('landing.successStories.description')}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-8 border-y border-white/20">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-turquoise-400 mb-2">500+</div>
                <div className="text-gray-300 text-sm">Elégedett ügyfél</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-turquoise-400 mb-2">70%</div>
                <div className="text-gray-300 text-sm">Átlagos időmegtakarítás</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-turquoise-400 mb-2">10K+</div>
                <div className="text-gray-300 text-sm">Ajánlat készült</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-turquoise-400 mb-2">98%</div>
                <div className="text-gray-300 text-sm">Ajánlja tovább</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Logo Showcase */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-12">
              Több mint 500 vállalkozás bízik a Vyndi-ben
            </h2>

            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-8 items-center mb-12">
              {customerLogos.map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                >
                  <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-semibold">{logo.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold text-turquoise-600 mb-2">500+</div>
                <div className="text-gray-600">Elégedett ügyfél</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-turquoise-600 mb-2">4.8/5</div>
                <div className="text-gray-600">Átlagos értékelés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-turquoise-600 mb-2">98%</div>
                <div className="text-gray-600">Ajánlanák másoknak</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-turquoise-600 mb-2">70%</div>
                <div className="text-gray-600">Átlagos időmegtakarítás</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filter & Search Section */}
      <section className="py-12 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Advanced Filters */}
            <CaseStudyFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              resultCount={filteredStudies.length}
            />

            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Keresés vállalat neve szerint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-100 min-h-[44px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rendezés:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turquoise-500 focus:outline-none min-h-[44px]"
                >
                  <option value="newest">Legújabb</option>
                  <option value="best-results">Legjobb eredmények</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Studies with Enhanced Design */}
      {featuredStudies.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-12">
              {featuredStudies.map((study) => (
                <div
                  key={study.id}
                  className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative bg-gradient-to-br from-turquoise-500 to-blue-500 min-h-[500px] flex items-center justify-center">
                      <div className="absolute inset-0 bg-navy-900/20"></div>

                      {/* Company Logo */}
                      <div className="absolute top-6 left-6 bg-white px-6 py-3 rounded-xl shadow-lg">
                        <span className="font-bold text-xl text-navy-900">{study.companyName}</span>
                      </div>

                      {/* Industry Badge */}
                      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold text-navy-900">
                        {study.industryLabel}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-10 flex flex-col">
                      {/* Quick Facts */}
                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Iparág</div>
                          <div className="font-semibold text-navy-900">{study.industryLabel}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Cégméret</div>
                          <div className="font-semibold text-navy-900">{study.companySize}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Időszak</div>
                          <div className="font-semibold text-navy-900">{study.timeline}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Csomag</div>
                          <div className="font-semibold text-navy-900">{study.plan}</div>
                        </div>
                      </div>

                      {/* Main Result */}
                      <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">
                        {study.mainResult}
                      </h3>

                      {/* Challenge */}
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-turquoise-600 uppercase tracking-wide mb-2">
                          Kihívás
                        </h4>
                        <p className="text-gray-700 text-base leading-relaxed text-pretty line-clamp-3">
                          {study.challenge}
                        </p>
                      </div>

                      {/* Solution */}
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-turquoise-600 uppercase tracking-wide mb-2">
                          Megoldás
                        </h4>
                        <p className="text-gray-700 text-base leading-relaxed text-pretty line-clamp-3">
                          {study.solution}
                        </p>
                      </div>

                      {/* Before/After Metrics */}
                      {study.metrics.length > 0 && study.metrics[0].before && (
                        <div className="mb-6">
                          <MetricComparison
                            before={{
                              value: study.metrics[0].before,
                              label: study.metrics[0].label,
                            }}
                            after={{
                              value: study.metrics[0].after || study.metrics[0].value,
                              label: study.metrics[0].label,
                            }}
                            improvement={study.metrics[0].improvement || ''}
                            timeline={study.timeline}
                          />
                        </div>
                      )}

                      {/* Testimonial */}
                      <div className="bg-gradient-to-br from-turquoise-50 to-blue-50 p-6 rounded-2xl border border-turquoise-200 relative mb-6 mt-auto">
                        <Quote className="absolute top-4 left-4 w-8 h-8 text-turquoise-300" />
                        <p className="text-gray-800 text-base italic mb-4 pl-8 text-pretty line-clamp-3">
                          {study.testimonial.quote}
                        </p>
                        <div className="flex items-center gap-4 pl-8">
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-turquoise-100 flex-shrink-0">
                            <Image
                              src={getAuthorImage(study.testimonial.author)}
                              alt={study.testimonial.author}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-navy-900">
                              {study.testimonial.author}
                            </div>
                            <div className="text-sm text-gray-600">{study.testimonial.role}</div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/success-stories/${study.slug}`}
                        className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        Teljes történet
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Case Studies Grid with Enhanced Cards */}
      {regularStudies.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularStudies.map((study) => (
                  <div
                    key={study.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-200 overflow-hidden flex flex-col min-h-[700px]"
                  >
                    {/* Header with gradient */}
                    <div className="h-48 relative bg-gradient-to-br from-turquoise-500 to-blue-500 flex items-center justify-center">
                      <div className="absolute inset-0 bg-navy-900/20"></div>
                      <h3 className="relative z-10 text-2xl font-bold text-white text-center px-4">
                        {study.companyName}
                      </h3>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-navy-900">
                        {study.industryLabel}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col">
                      {/* Quick Facts */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Cégméret</div>
                          <div className="font-semibold text-sm text-navy-900">
                            {study.companySize}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Időszak</div>
                          <div className="font-semibold text-sm text-navy-900">
                            {study.timeline}
                          </div>
                        </div>
                      </div>

                      {/* Main Result */}
                      <h4 className="text-lg font-bold text-navy-900 mb-3 line-clamp-2">
                        {study.mainResult}
                      </h4>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {study.metrics.slice(0, 3).map((metric, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-2xl font-bold text-turquoise-600 mb-1">
                              {metric.value}
                            </div>
                            <div className="text-xs text-gray-600 leading-tight">
                              {metric.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3 text-pretty flex-1">
                        {study.shortDescription}
                      </p>

                      {/* Testimonial Snippet */}
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm line-clamp-2 italic text-pretty">
                          &ldquo;{study.testimonial.quote}&rdquo;
                        </p>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-turquoise-100 flex-shrink-0">
                          <Image
                            src={getAuthorImage(study.testimonial.author)}
                            alt={study.testimonial.author}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-navy-900">
                            {study.testimonial.author}
                          </div>
                          <div className="text-xs text-gray-600">{study.testimonial.role}</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/success-stories/${study.slug}`}
                        className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 min-h-[44px] mt-auto"
                      >
                        Teljes történet
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* No Results State */}
      {filteredStudies.length === 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-4 text-balance">Nincs találat</h3>
              <p className="text-gray-600 mb-6 text-pretty">
                Próbálj más szűrőket vagy keresési feltételeket használni.
              </p>
              <button
                onClick={() => {
                  setFilters({
                    industry: 'all',
                    companySize: 'all',
                    resultsType: 'all',
                    useCase: 'all',
                  });
                  setSearchQuery('');
                }}
                className="bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-8 py-3 rounded-xl transition-all min-h-[44px]"
              >
                Szűrők törlése
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ROI Calculator Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
                Mennyit takaríthatnál meg?
              </h2>
              <p className="text-xl text-gray-600">
                Számold ki, mennyit érnének a hasonló eredmények a Te vállalkozásodnál
              </p>
            </div>

            <ROICalculator />
          </div>
        </div>
      </section>

      {/* Enhanced Bottom CTA Section */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
              Érj el hasonló eredményeket
              <br />a következő 30 napban
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Csatlakozz 500+ céghez, akik már átlagosan 70%-kal gyorsabban készítik ajánlataikat és
              35%-kal magasabb konverziós rátát érnek el
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
                className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-12 py-5 rounded-xl text-lg shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3 min-h-[44px]"
              >
                14 napos ingyenes próba
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/billing"
                className="bg-transparent hover:bg-white/10 text-white font-bold px-12 py-5 rounded-xl text-lg border-2 border-white transition-all inline-flex items-center gap-3 min-h-[44px]"
              >
                <MessageCircle className="w-5 h-5" />
                Demo kérése
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>14 napos ingyenes próba</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Nincs bankkártya</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>30 napos garancia</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Bármikor lemondható</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
