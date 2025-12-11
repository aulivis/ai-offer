'use client';

import { useState, useMemo } from 'react';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
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
  SlidersHorizontal,
} from 'lucide-react';
import { t } from '@/copy';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { getResources, getFeaturedResource } from '@/lib/resources';
import { Resource, ResourceFilters } from '@/types/resource';
import { H1, H2, H3 } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

// Lazy load resource components for route-based code splitting
const ResourceCard = dynamic(
  () => import('@/components/resource-card').then((mod) => mod.ResourceCard),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const ResourceFiltersComponent = dynamic(
  () => import('@/components/resource-filters').then((mod) => mod.ResourceFiltersComponent),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const NewsletterSubscription = dynamic(
  () =>
    import('@/components/landing/NewsletterSubscription').then((mod) => mod.NewsletterSubscription),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-bg-muted" />,
  },
);

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
  return (
    <PageErrorBoundary>
      <ResourcesPageContent />
    </PageErrorBoundary>
  );
}

function ResourcesPageContent() {
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
      <section className="py-12 lg:py-16 bg-gradient-hero text-white -mt-14 md:-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Breadcrumb */}
            <nav
              className="text-body-small mb-6 flex items-center gap-2 text-white/70"
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
              <div className="inline-block px-4 py-2 bg-turquoise-500/20 backdrop-blur-sm rounded-full text-body-small font-semibold text-turquoise-300 mb-6">
                Erőforrások
              </div>

              <H1 className="mb-6" fluid>
                Tanulj és fejlődj
              </H1>

              <p className="text-body-large md:text-h6 text-white mb-8 leading-typography-relaxed max-w-3xl">
                Hozzáférés útmutatókhoz, videókhoz, cikkekhez és további tartalmakhoz az
                ajánlatkészítéshez
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/login?redirect=/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-turquoise-600 text-[var(--color-primary-ink)] hover:from-[var(--color-primary)]/90 hover:via-[var(--color-primary)]/90 hover:to-turquoise-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-300 shadow-md w-full md:w-auto"
                  style={
                    {
                      '--color-primary': 'var(--color-turquoise-600)',
                      '--color-primary-ink': '#ffffff',
                    } as React.CSSProperties
                  }
                >
                  Próbáld ki most ingyen
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#main-content"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] border-2 border-white text-white hover:border-primary hover:text-primary bg-transparent transition-all w-full md:w-auto"
                >
                  További információ
                </a>
              </div>

              {/* Enhanced Search Bar */}
              <div className="mb-8 max-w-2xl relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-muted pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Keress útmutatók, cikkek vagy videók között..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/10 backdrop-blur text-white placeholder:text-white/50 border-white/20 focus:border-primary/50"
                  aria-label="Keresés erőforrások között"
                />
              </div>
            </div>

            {/* Prominent Featured Card - Enhanced hierarchy */}
            {featuredResource && (
              <Card
                size="lg"
                variant="elevated"
                className="relative bg-gradient-cta text-white border-4 border-white/20 overflow-hidden"
              >
                {/* Decorative elements */}
                <div
                  className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                  aria-hidden="true"
                ></div>
                <div
                  className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"
                  aria-hidden="true"
                ></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  {/* Left - Featured badge and content */}
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6 border-2 border-white/30 shadow-lg">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-body-small font-bold uppercase tracking-wide">
                        KIEMELT TARTALOM
                      </span>
                    </div>
                    <H2 className="mb-5 text-white" fluid>
                      {featuredResource.title}
                    </H2>
                    <p className="text-white/95 text-body-large md:text-h6 mb-8 leading-typography-relaxed font-medium">
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
                      className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] bg-bg-muted text-primary hover:scale-105 hover:shadow-lg active:scale-95 transition-all border-2 border-white/50"
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
                        priority
                        sizes="(max-width: 768px) 100vw, 384px"
                      />
                    ) : (
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl p-12 flex items-center justify-center">
                        <FileText className="w-32 h-32 text-white/50" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Filter & Search Section */}
      <section
        id="main-content"
        className="py-8 bg-bg border-b border-border sticky top-0 z-40 backdrop-blur-lg bg-bg/95"
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
                className="w-full flex items-center justify-between bg-bg-muted border-2 border-border rounded-2xl p-4 hover:border-primary transition-colors"
                aria-label="Szűrők megnyitása"
              >
                <span className="font-semibold">Szűrők</span>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-ink w-6 h-6 rounded-full flex items-center justify-center text-body-small font-bold">
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
              <span className="text-body-small font-semibold text-fg">Szűrés:</span>

              {/* Primary category filters - pill style */}
              {['Összes', 'Útmutatók', 'Blog cikkek', 'Videók'].map((type) => {
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
                        ? 'bg-primary text-primary-ink shadow-md ring-2 ring-primary/30 scale-105'
                        : 'bg-bg-muted text-fg border-2 border-border hover:border-primary hover:bg-bg'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}

              {/* Active filter count indicator */}
              {activeFiltersCount > 0 && (
                <span className="ml-auto flex items-center gap-2 text-body-small text-fg-muted">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                    {activeFiltersCount} szűrő aktív
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:underline font-semibold"
                  >
                    Törlés
                  </button>
                </span>
              )}
            </div>

            {/* Search, Sort, and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Results Count with Screen Reader Announcement */}
              <div className="text-fg">
                <span className="font-bold text-navy-900">{filteredResources.length}</span>{' '}
                erőforrás találva
              </div>
              <div aria-live="polite" aria-atomic="true" className="sr-only">
                {filteredResources.length} erőforrás található
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <span className="text-body-small text-fg-muted">Rendezés:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 border-2 border-border rounded-2xl text-body-small font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
                  aria-label="Rendezési opciók"
                >
                  <option value="newest">Legújabb</option>
                  <option value="popular">Legnépszerűbb</option>
                  <option value="most-helpful">Leghasznosabb</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-ink'
                      : 'text-fg-muted hover:bg-bg-muted'
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
                      ? 'bg-primary text-primary-ink'
                      : 'text-fg-muted hover:bg-bg-muted'
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
                    <Flame className="w-6 h-6 text-warning" />
                    <H2>Népszerű tartalmak</H2>
                  </div>
                  <p className="text-fg-muted">
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
        <section className="py-16 bg-bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <H2 className="mb-2">Összes erőforrás ({regularResources.length})</H2>
                  <p className="text-fg-muted">Böngészd az összes elérhető tartalmat</p>
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
              <div className="w-24 h-24 bg-bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-fg-muted" />
              </div>
              <H3 className="mb-2">Nincs találat</H3>
              <p className="text-fg-muted mb-6">
                Próbáld meg módosítani a szűrőket vagy a keresési kifejezést
              </p>
              <button
                onClick={clearFilters}
                className="text-primary font-semibold hover:underline min-h-[44px]"
              >
                Összes szűrő törlése
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Newsletter Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Enhanced gradient background with pattern overlay */}
        <div className="absolute inset-0 bg-gradient-cta">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Compelling headline with better messaging */}
            <div className="text-center mb-12">
              <H2 className="text-white mb-6" fluid>
                Szeretnéd elsőként kipróbálni az újdonságokat?
              </H2>
              <p className="text-body-large md:text-h6 text-white/90 leading-typography-relaxed max-w-3xl mx-auto text-pretty">
                Iratkozz fel, és értesülj az újdonságokról, tippekről és az új funkciók indulásáról.
                <br />
                Csatlakozz több mint 200 vállalkozáshoz, akik már hatékonyabban dolgoznak az
                ajánlatkészítésben.
              </p>
            </div>

            {/* Newsletter subscription form */}
            <NewsletterSubscription source="landing_page" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-cta relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <H2 className="mb-6 text-white text-balance" fluid>
                {t('resources.ctaTitle')}
              </H2>

              <p className="text-body-large md:text-h6 text-white/90 mb-12 text-pretty leading-typography-relaxed">
                {t('resources.ctaDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  href="/login?redirect=/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] bg-bg-muted text-primary hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
                >
                  {t('resources.ctaButton')}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center gap-2 rounded-full font-semibold px-7 py-4 text-ui min-h-[48px] bg-transparent hover:bg-white/10 text-white border-2 border-white transition-all"
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
