'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  Calendar,
  Grid,
  List,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { t } from '@/copy';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { getResources, getFeaturedResource } from '@/lib/resources';
import { Resource, ResourceFilters } from '@/types/resource';
import { ResourceCard } from '@/components/resource-card';
import { ResourceFiltersComponent } from '@/components/resource-filters';

type SortOption = 'newest' | 'popular' | 'most-helpful';

function filterResources(
  resources: Resource[],
  filters: ResourceFilters,
  searchQuery: string,
): Resource[] {
  return resources.filter((resource) => {
    // Type filter
    if (filters.type.length > 0 && !filters.type.includes('Összes')) {
      const typeMap: Record<string, string> = {
        Útmutatók: 'guide',
        'Blog cikkek': 'blog',
        Videók: 'video',
        Sablonok: 'template',
      };

      // Check if resource type matches any selected filter
      const matchesType = filters.type.some((filterLabel) => {
        const filterType = typeMap[filterLabel];
        return filterType === resource.type;
      });

      if (!matchesType) {
        return false;
      }
    }

    // Topic filter (placeholder - would need topic field in data)
    if (filters.topic.length > 0) {
      // Match by tags or categories
      const matchesTopic = filters.topic.some(
        (topic) =>
          resource.tags.some((tag) => tag.toLowerCase().includes(topic.toLowerCase())) ||
          resource.categories.some((cat) => cat.toLowerCase().includes(topic.toLowerCase())),
      );
      if (!matchesTopic) return false;
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      if (!filters.difficulty.includes(resource.difficulty)) return false;
    }

    // Format filter (based on reading time or video duration)
    if (filters.format.length > 0) {
      const matchesFormat = filters.format.some((format) => {
        if (format.includes('Rövid')) {
          return (
            (resource.readingTime && resource.readingTime < 5) ||
            (resource.videoDuration && resource.videoDuration < 5)
          );
        } else if (format.includes('Közepes')) {
          return (
            (resource.readingTime && resource.readingTime >= 5 && resource.readingTime <= 15) ||
            (resource.videoDuration && resource.videoDuration >= 5 && resource.videoDuration <= 15)
          );
        } else if (format.includes('Hosszú')) {
          return (
            (resource.readingTime && resource.readingTime > 15) ||
            (resource.videoDuration && resource.videoDuration > 15)
          );
        }
        return false;
      });
      if (!matchesFormat) return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.excerpt.toLowerCase().includes(query) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    return true;
  });
}

export default function ResourcesPage() {
  const { status } = useOptionalAuth();
  const isAuthenticated = status === 'authenticated';
  const [filters, setFilters] = useState<ResourceFilters>({
    type: [],
    topic: [],
    difficulty: [],
    format: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const resources = getResources();
  const featuredResource = getFeaturedResource();

  const filteredResources = useMemo(() => {
    let filtered = filterResources(resources, filters, searchQuery);

    // Sort
    if (sortBy === 'newest') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
      );
    } else if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => b.views - a.views);
    } else if (sortBy === 'most-helpful') {
      // Placeholder: sort by featured first, then views
      filtered = [...filtered].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.views - a.views;
      });
    }

    return filtered;
  }, [resources, filters, searchQuery, sortBy]);

  const featuredResources = filteredResources.filter((r) => r.featured);
  const regularResources = filteredResources.filter((r) => !r.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/70 mb-8">
              <Link href="/" className="hover:text-white">
                Főoldal
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Erőforrások</span>
            </div>

            {/* Hero Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-turquoise-500/20 rounded-full text-sm font-semibold text-turquoise-300 mb-6">
                  Erőforrások
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Tanulj és fejlődj
                </h1>

                <p className="text-xl text-white/80 mb-8 leading-relaxed">
                  Hozzáférés útmutatókhoz, videókhoz, cikkekhez és további tartalmakhoz az
                  ajánlatkészítéshez
                </p>

                {/* Search Bar */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Keress útmutatók, cikkek között..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-turquoise-400 focus:border-transparent min-h-[44px]"
                  />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-turquoise-400 mb-1">50+</div>
                    <div className="text-sm text-white/70">Útmutatók</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-turquoise-400 mb-1">100+</div>
                    <div className="text-sm text-white/70">Cikkek</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-turquoise-400 mb-1">25+</div>
                    <div className="text-sm text-white/70">Videók</div>
                  </div>
                </div>
              </div>

              {/* Right: Featured Resource Card */}
              {featuredResource && (
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* Featured Image/Visual */}
                  <div className="relative h-64 bg-gradient-to-br from-turquoise-400 to-blue-500 flex items-center justify-center">
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white text-turquoise-600 rounded-full text-xs font-bold uppercase">
                        Népszerű Útmutató
                      </span>
                    </div>
                    <FileText className="w-24 h-24 text-white/30" />
                  </div>

                  {/* Card Content */}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-navy-900 mb-4 leading-tight">
                      {featuredResource.title}
                    </h3>

                    <p className="text-gray-700 mb-6 leading-relaxed line-clamp-3">
                      {featuredResource.excerpt || featuredResource.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {featuredResource.publishedDate}
                      </div>
                      {featuredResource.readingTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {featuredResource.readingTime} perc olvasás
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredResource.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      href={featuredResource.href || `/resources/guides/${featuredResource.slug}`}
                      className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group min-h-[44px]"
                    >
                      Elolvasom
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filter & Search Section */}
      <section className="py-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Advanced Filters */}
            <ResourceFiltersComponent
              activeFilters={filters}
              onFilterChange={setFilters}
              resultCount={filteredResources.length}
            />

            {/* Search, Sort, and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Results Count */}
              <div className="text-gray-700">
                <span className="font-bold text-navy-900">{filteredResources.length}</span>{' '}
                erőforrás találva
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Rendezés:</span>
                <div className="flex gap-2">
                  {(['newest', 'popular', 'most-helpful'] as SortOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
                        sortBy === option
                          ? 'bg-turquoise-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option === 'newest'
                        ? 'Legújabb'
                        : option === 'popular'
                          ? 'Legnépszerűbb'
                          : 'Leghasznosabb'}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] ${
                    viewMode === 'grid'
                      ? 'bg-turquoise-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors min-h-[44px] min-w-[44px] ${
                    viewMode === 'list'
                      ? 'bg-turquoise-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources Grid */}
      {featuredResources.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-8 h-8 text-turquoise-600" />
                <h2 className="text-3xl font-bold text-navy-900">Népszerű tartalmak</h2>
              </div>

              <div
                className={
                  viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'
                }
              >
                {featuredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Resources Grid */}
      {regularResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 mb-8 text-balance">
                Összes erőforrás ({regularResources.length})
              </h2>

              <div
                className={
                  viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'
                }
              >
                {regularResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* No Results State */}
      {filteredResources.length === 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-navy-900 mb-4 text-balance">Nincs találat</h3>
              <p className="text-gray-600 mb-6 text-pretty">
                Próbálj más keresési kifejezést vagy szűrőt használni.
              </p>
              <button
                onClick={() => {
                  setFilters({
                    type: [],
                    topic: [],
                    difficulty: [],
                    format: [],
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

      {/* Newsletter Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-turquoise-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-turquoise-600" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4 text-balance">
              Ne maradj le az új tartalmakról
            </h2>

            <p className="text-lg text-gray-600 mb-8 text-pretty">
              Hetente friss útmutatókat, cikkeket és tippeket küldünk az ajánlatkészítésről
            </p>

            <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="email"
                placeholder="Add meg az email címedet"
                className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-100 text-lg min-h-[44px]"
              />
              <button className="bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px]">
                Feliratkozás
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Heti 1 email</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Gyakorlati tippek</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Bármikor leiratkozhatsz</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-br from-turquoise-500 to-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                {t('resources.ctaTitle')}
              </h2>

              <p className="text-xl md:text-2xl text-white/90 mb-12 text-pretty">
                {t('resources.ctaDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  href="/login?redirect=/new"
                  className="bg-white hover:bg-gray-50 text-turquoise-600 font-bold px-12 py-5 rounded-xl text-lg shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3 min-h-[44px]"
                >
                  {t('resources.ctaButton')}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/billing"
                  className="bg-transparent hover:bg-white/10 text-white font-bold px-12 py-5 rounded-xl text-lg border-2 border-white transition-all inline-flex items-center gap-3 min-h-[44px]"
                >
                  Csomagok megtekintése
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('resources.trustBadges.freeTrial')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('resources.trustBadges.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('resources.trustBadges.instantAccess')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
