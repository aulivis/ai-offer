'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Search,
  Quote,
} from 'lucide-react';
import { t } from '@/copy';

const industries = [
  { id: 'all', label: 'Összes' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'it', label: 'IT & Szoftverfejlesztés' },
  { id: 'creative', label: 'Kreatív' },
  { id: 'consulting', label: 'Tanácsadás' },
  { id: 'construction', label: 'Építőipar' },
];

function getCaseStudies() {
  const baseStudies = [
    {
      id: 1,
      company: t('landing.caseStudiesInline.studioFluo.company'),
      industry: 'creative',
      industryLabel: t('landing.caseStudiesInline.studioFluo.industry'),
      featured: true,
      challenge: t('landing.caseStudiesInline.studioFluo.challenge'),
      solution: t('landing.caseStudiesInline.studioFluo.solution'),
      results: [
        {
          metric: '70%',
          label: t('landing.caseStudiesInline.studioFluo.results.timeSaved'),
          icon: Clock,
        },
        {
          metric: '25+',
          label: t('landing.caseStudiesInline.studioFluo.results.offersPerWeek'),
          icon: TrendingUp,
        },
        {
          metric: '+35%',
          label: t('landing.caseStudiesInline.studioFluo.results.acceptanceRate'),
          icon: CheckCircle,
        },
      ],
      testimonial: {
        quote: t('landing.caseStudiesInline.studioFluo.quote'),
        author: t('landing.caseStudiesInline.studioFluo.author'),
        role: t('landing.caseStudiesInline.studioFluo.role'),
      },
      stats: {
        timeSaved: '150+ óra/hó',
        revenue: '+40% árbevétel',
        proposals: '500+ ajánlat',
      },
      hasVideo: true,
      hasPDF: true,
    },
    {
      id: 2,
      company: t('landing.caseStudiesInline.techSolutions.company'),
      industry: 'it',
      industryLabel: t('landing.caseStudiesInline.techSolutions.industry'),
      featured: true,
      challenge: t('landing.caseStudiesInline.techSolutions.challenge'),
      solution: t('landing.caseStudiesInline.techSolutions.solution'),
      results: [
        {
          metric: '-65%',
          label: t('landing.caseStudiesInline.techSolutions.results.offerTime'),
          icon: Clock,
        },
        {
          metric: '50+',
          label: t('landing.caseStudiesInline.techSolutions.results.templatesCount'),
          icon: CheckCircle,
        },
        {
          metric: '98%',
          label: t('landing.caseStudiesInline.techSolutions.results.satisfaction'),
          icon: Star,
        },
      ],
      testimonial: {
        quote: t('landing.caseStudiesInline.techSolutions.quote'),
        author: t('landing.caseStudiesInline.techSolutions.author'),
        role: t('landing.caseStudiesInline.techSolutions.role'),
      },
      stats: {
        timeSaved: '200+ óra/hó',
        revenue: '+55% megrendelés',
        proposals: '800+ ajánlat',
      },
      hasVideo: false,
      hasPDF: true,
    },
    {
      id: 3,
      company: t('landing.caseStudiesInline.creativeAgency.company'),
      industry: 'marketing',
      industryLabel: t('landing.caseStudiesInline.creativeAgency.industry'),
      featured: false,
      challenge: t('landing.caseStudiesInline.creativeAgency.challenge'),
      solution: t('landing.caseStudiesInline.creativeAgency.solution'),
      results: [
        {
          metric: '-80%',
          label: t('landing.caseStudiesInline.creativeAgency.results.templateTime'),
          icon: Clock,
        },
        {
          metric: '100%',
          label: t('landing.caseStudiesInline.creativeAgency.results.consistentAppearance'),
          icon: CheckCircle,
        },
        {
          metric: '40+',
          label: t('landing.caseStudiesInline.creativeAgency.results.offersPerMonth'),
          icon: TrendingUp,
        },
      ],
      testimonial: {
        quote: t('landing.caseStudiesInline.creativeAgency.quote'),
        author: t('landing.caseStudiesInline.creativeAgency.author'),
        role: t('landing.caseStudiesInline.creativeAgency.role'),
      },
      stats: {
        timeSaved: '120+ óra/hó',
        revenue: '+30% árbevétel',
        proposals: '400+ ajánlat',
      },
      hasVideo: true,
      hasPDF: true,
    },
  ];

  return baseStudies;
}

export default function SuccessStoriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const caseStudies = getCaseStudies();

  const filteredStories = caseStudies.filter((story) => {
    const matchesIndustry = selectedIndustry === 'all' || story.industry === selectedIndustry;
    const matchesSearch =
      story.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.industryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const featuredStories = filteredStories.filter((s) => s.featured);
  const regularStories = filteredStories.filter((s) => !s.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      {/* More impactful hero with social proof and trust indicators */}
      <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-block px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
              {t('landing.successStories.badge')}
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              Valós eredmények
              <br />
              valós ügyfelektől
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed text-pretty">
              {t('landing.successStories.description')}
            </p>

            {/* Trust Indicators Bar */}
            {/* Added prominent social proof metrics */}
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

      {/* Filter & Search Section */}
      {/* Added industry filtering and search */}
      <section className="py-12 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Industry Filter */}
            <div className="flex flex-wrap gap-3">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all min-h-[44px] ${
                    selectedIndustry === industry.id
                      ? 'bg-turquoise-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {industry.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
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
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      {/* Enhanced featured stories with larger cards and rich media */}
      {featuredStories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto space-y-12">
              {featuredStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image/Video Section */}
                    <div className="relative bg-gradient-to-br from-turquoise-500 to-blue-500 min-h-[400px] flex items-center justify-center">
                      {/* Placeholder for image or video thumbnail */}
                      <div className="absolute inset-0 bg-navy-900/20"></div>

                      {story.hasVideo && (
                        <button className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform min-h-[44px] min-w-[44px]">
                          <Play className="w-8 h-8 text-turquoise-600 ml-1" fill="currentColor" />
                        </button>
                      )}

                      {/* Company Logo Overlay */}
                      <div className="absolute top-6 left-6 bg-white px-6 py-3 rounded-xl shadow-lg">
                        <span className="font-bold text-xl text-navy-900">{story.company}</span>
                      </div>

                      {/* Industry Badge */}
                      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold text-navy-900">
                        {story.industryLabel}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-10">
                      {/* Challenge */}
                      <div className="mb-8">
                        <h3 className="text-sm font-bold text-turquoise-600 uppercase tracking-wide mb-3">
                          Kihívás
                        </h3>
                        <p className="text-gray-700 text-lg leading-relaxed text-pretty">
                          {story.challenge}
                        </p>
                      </div>

                      {/* Solution */}
                      <div className="mb-8">
                        <h3 className="text-sm font-bold text-turquoise-600 uppercase tracking-wide mb-3">
                          Megoldás
                        </h3>
                        <p className="text-gray-700 text-lg leading-relaxed text-pretty">
                          {story.solution}
                        </p>
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {story.results.map((result, idx) => {
                          const Icon = result.icon;
                          return (
                            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
                              <Icon className="w-6 h-6 text-turquoise-600 mx-auto mb-2" />
                              <div className="text-3xl font-bold text-navy-900 mb-1">
                                {result.metric}
                              </div>
                              <div className="text-xs text-gray-600">{result.label}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Testimonial */}
                      <div className="bg-gradient-to-br from-turquoise-50 to-blue-50 p-6 rounded-2xl border border-turquoise-200 relative">
                        <Quote className="absolute top-4 left-4 w-8 h-8 text-turquoise-300" />
                        <p className="text-gray-800 text-lg italic mb-4 pl-8 text-pretty">
                          {story.testimonial.quote}
                        </p>
                        <div className="flex items-center gap-4 pl-8">
                          <div className="w-12 h-12 bg-turquoise-200 rounded-full flex items-center justify-center text-turquoise-700 font-bold text-lg">
                            {story.testimonial.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-navy-900">
                              {story.testimonial.author}
                            </div>
                            <div className="text-sm text-gray-600">{story.testimonial.role}</div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex gap-4 mt-8">
                        <Link
                          href={`/success-stories/${story.id}`}
                          className="flex-1 bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          Teljes történet
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                        {story.hasPDF && (
                          <button className="px-6 bg-white hover:bg-gray-50 border-2 border-turquoise-600 text-turquoise-600 font-bold py-4 rounded-xl transition-all inline-flex items-center gap-2 min-h-[44px]">
                            <Download className="w-5 h-5" />
                            PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Case Studies Grid */}
      {/* Improved card grid with better visual hierarchy */}
      {regularStories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularStories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-200 overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    <div className="relative bg-gradient-to-br from-turquoise-500 to-blue-500 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 bg-navy-900/20"></div>

                      {/* Company Name */}
                      <h3 className="relative z-10 text-2xl font-bold text-white">
                        {story.company}
                      </h3>

                      {/* Industry Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-navy-900">
                        {story.industryLabel}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Results Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {story.results.map((result, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-2xl font-bold text-turquoise-600 mb-1">
                              {result.metric}
                            </div>
                            <div className="text-xs text-gray-600 leading-tight">
                              {result.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Testimonial Snippet */}
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3 italic text-pretty">
                        &ldquo;{story.testimonial.quote}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                        <div className="w-10 h-10 bg-turquoise-100 rounded-full flex items-center justify-center text-turquoise-700 font-bold">
                          {story.testimonial.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-navy-900">
                            {story.testimonial.author}
                          </div>
                          <div className="text-xs text-gray-600">{story.testimonial.role}</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/success-stories/${story.id}`}
                        className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 group-hover:gap-3 min-h-[44px]"
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
      {filteredStories.length === 0 && (
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
                  setSelectedIndustry('all');
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

      {/* Bottom CTA Section */}
      {/* Compelling CTA to convert visitors */}
      <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
              Készen állsz, hogy te is ilyen
              <br />
              eredményeket érj el?
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-12 text-pretty">
              {t('landing.successStories.ctaDescription')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/login?redirect=/new"
                className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-12 py-5 rounded-xl text-lg shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3 min-h-[44px]"
              >
                {t('landing.successStories.ctaButton')}
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/billing"
                className="bg-transparent hover:bg-white/10 text-white font-bold px-12 py-5 rounded-xl text-lg border-2 border-white transition-all inline-flex items-center gap-3 min-h-[44px]"
              >
                {t('landing.successStories.viewPackages')}
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>14 napos ingyenes próba</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Nincs bankkártya</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Bármikor lemondható</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
