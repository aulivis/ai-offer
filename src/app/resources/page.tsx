'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  Grid,
  List,
  CheckCircle,
  Star,
  Download,
  Eye,
  Flame,
  Bell,
  SlidersHorizontal,
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

  // Calculate active filters count
  const activeFiltersCount =
    filters.type.length + filters.topic.length + filters.difficulty.length + filters.format.length;

  // Get active category for breadcrumb
  const activeCategory = filters.type.length > 0 ? filters.type[0] : null;

  const clearFilters = () => {
    setFilters({
      type: [],
      topic: [],
      difficulty: [],
      format: [],
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-turquoise-600 focus:text-white focus:rounded-lg"
      >
        Ugrás a tartalomhoz
      </a>

      {/* Enhanced Hero Section */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-navy-900 via-navy-800 to-turquoise-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Breadcrumb */}
            <nav
              className="text-sm mb-6 flex items-center gap-2 text-white/70"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-white transition-colors">
                Főoldal
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">Erőforrások</span>
              {activeCategory && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-turquoise-300">{activeCategory}</span>
                </>
              )}
            </nav>

            {/* Hero Content */}
            <div className="mb-12">
              <div className="inline-block px-4 py-2 bg-turquoise-500/20 backdrop-blur-sm rounded-full text-sm font-semibold text-turquoise-300 mb-6">
                Erőforrások
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Tanulj és fejlődj
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-3xl">
                Hozzáférés útmutatókhoz, videókhoz, cikkekhez és további tartalmakhoz az
                ajánlatkészítéshez
              </p>

              {/* Enhanced Search Bar */}
              <div className="relative mb-8 max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Keress útmutatók, cikkek vagy videók között..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur text-white placeholder:text-white/50 focus:outline-none focus:ring-4 focus:ring-turquoise-100 focus:border-turquoise-500 transition-all text-base min-h-[44px]"
                  aria-label="Keresés erőforrások között"
                />
              </div>
            </div>

            {/* Prominent Featured Card */}
            {featuredResource && (
              <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Left - Featured badge and content */}
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">KIEMELT TARTALOM</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      {featuredResource.title}
                    </h2>
                    <p className="text-white/90 text-lg mb-6">
                      {featuredResource.excerpt || featuredResource.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      {featuredResource.downloadCount && (
                        <div className="flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          <span>{featuredResource.downloadCount} letöltés</span>
                        </div>
                      )}
                      {featuredResource.readingTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          <span>{featuredResource.readingTime} perc olvasás</span>
                        </div>
                      )}
                      {featuredResource.views && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          <span>{featuredResource.views.toLocaleString()} megtekintés</span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={featuredResource.href || `/resources/guides/${featuredResource.slug}`}
                      className="inline-block bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all min-h-[44px]"
                    >
                      Letöltöm ingyen
                    </Link>
                  </div>

                  {/* Right - Visual preview */}
                  <div className="w-full md:w-96">
                    {featuredResource.featuredImage ? (
                      <Image
                        src={featuredResource.featuredImage}
                        width={384}
                        height={256}
                        className="rounded-xl shadow-2xl w-full h-auto"
                        alt={featuredResource.title}
                      />
                    ) : (
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl p-12 flex items-center justify-center">
                        <FileText className="w-32 h-32 text-white/50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Filter & Search Section */}
      <section
        id="main-content"
        className="py-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/95"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => {
                  // Toggle filter visibility on mobile
                  const filterSection = document.getElementById('filter-section');
                  filterSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-turquoise-500 transition-colors"
                aria-label="Szűrők megnyitása"
              >
                <span className="font-semibold">Szűrők</span>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <span className="bg-turquoise-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Advanced Filters */}
            <div id="filter-section">
              <ResourceFiltersComponent
                activeFilters={filters}
                onFilterChange={setFilters}
                resultCount={filteredResources.length}
              />
            </div>

            {/* Enhanced Filter Visualization */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-gray-700">Szűrés:</span>

              {/* Primary category filters - pill style */}
              {['Összes', 'Útmutatók', 'Blog cikkek', 'Videók', 'Sablonok'].map((type) => {
                const isAllSelected = filters.type.length === 0;
                const isActive = type === 'Összes' ? isAllSelected : filters.type.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'Összes') {
                        setFilters({ ...filters, type: [] });
                      } else {
                        const newTypes = isActive
                          ? filters.type.filter((t) => t !== type)
                          : [...filters.type.filter((t) => t !== 'Összes'), type];
                        setFilters({ ...filters, type: newTypes });
                      }
                    }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="resources-panel"
                    className={`px-6 py-2.5 rounded-full font-medium shadow-sm transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-teal-500'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}

              {/* Active filter count indicator */}
              {activeFiltersCount > 0 && (
                <span className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-semibold">
                    {activeFiltersCount} szűrő aktív
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-teal-600 hover:underline font-semibold"
                  >
                    Törlés
                  </button>
                </span>
              )}
            </div>

            {/* Search, Sort, and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Results Count with Screen Reader Announcement */}
              <div className="text-gray-700">
                <span className="font-bold text-navy-900">{filteredResources.length}</span>{' '}
                erőforrás találva
              </div>
              <div aria-live="polite" aria-atomic="true" className="sr-only">
                {filteredResources.length} erőforrás található
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Rendezés:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 min-h-[44px]"
                  aria-label="Rendezési opciók"
                >
                  <option value="newest">Legújabb</option>
                  <option value="popular">Legnépszerűbb</option>
                  <option value="most-helpful">Leghasznosabb</option>
                </select>
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
                  aria-label="Rács nézet"
                  aria-pressed={viewMode === 'grid'}
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
                  aria-label="Lista nézet"
                  aria-pressed={viewMode === 'list'}
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Népszerű tartalmak</h2>
                  </div>
                  <p className="text-gray-600">
                    A legtöbbet megtekintett és letöltött erőforrások az elmúlt 30 napban
                  </p>
                </div>
              </div>

              <div
                id="resources-panel"
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Összes erőforrás ({regularResources.length})
                  </h2>
                  <p className="text-gray-600">Böngészd az összes elérhető tartalmat</p>
                </div>
              </div>

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
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nincs találat</h3>
              <p className="text-gray-600 mb-6">
                Próbáld meg módosítani a szűrőket vagy a keresési kifejezést
              </p>
              <button
                onClick={clearFilters}
                className="text-teal-600 font-semibold hover:underline min-h-[44px]"
              >
                Összes szűrő törlése
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Newsletter Section */}
      <section className="py-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl mx-4 md:mx-auto my-16 max-w-6xl">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            {/* Icon */}
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-3xl font-bold mb-3">Ne maradj le az új tartalmakról!</h3>
            <p className="text-white/90 text-lg mb-8">
              Hetente új útmutatók, cikkek és videók közvetlenül az email fiókodba
            </p>

            {/* Email form - inline, no checkboxes */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-4">
              <input
                type="email"
                placeholder="Add meg az email címed"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px]"
                aria-label="Email cím"
              />
              <button className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all whitespace-nowrap min-h-[44px]">
                Feliratkozom
              </button>
            </div>

            {/* Single line consent */}
            <p className="text-white/70 text-sm">
              A feliratkozással elfogadod az{' '}
              <a href="/adatvedelem" className="underline hover:text-white">
                Adatvédelmi szabályzatot
              </a>
            </p>
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
