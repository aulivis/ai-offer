'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Download,
  Play,
  Clock,
  User,
  BookOpen,
  FileText,
  Video,
  Sparkles,
  TrendingUp,
  Filter,
  CheckCircle,
  Star,
  Eye,
} from 'lucide-react';
import { t } from '@/copy';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

const contentTypes = [
  { id: 'all', label: 'Összes', icon: Sparkles },
  { id: 'guides', label: 'Útmutatók', icon: BookOpen },
  { id: 'templates', label: 'Sablonok', icon: FileText },
  { id: 'articles', label: 'Blog cikkek', icon: FileText },
  { id: 'videos', label: 'Videók', icon: Video },
];

function getResources() {
  return [
    // Guides
    {
      id: 1,
      type: 'guides',
      title: t('resources.items.guide.title'),
      description: t('resources.items.guide.description'),
      category: t('resources.categories.guides'),
      categoryColor: 'blue',
      href: '/resources/guide',
      author: { name: 'Kiss Júlia', avatar: '/avatars/kiss-julia.jpg' },
      readTime: '8 perc',
      publishDate: '2025. jan. 10.',
      views: '1.2K',
      tags: ['Kezdő', 'Útmutató'],
      isPremium: false,
      featured: false,
    },
    {
      id: 2,
      type: 'guides',
      title: t('resources.items.aiGuide.title'),
      description: t('resources.items.aiGuide.description'),
      category: t('resources.categories.guides'),
      categoryColor: 'blue',
      href: '/resources/ai-guide',
      author: { name: 'Nagy Péter', avatar: '/avatars/nagy-peter.jpg' },
      readTime: '10 perc',
      publishDate: '2025. jan. 8.',
      views: '980',
      tags: ['AI', 'Haladó'],
      isPremium: false,
      featured: true,
    },
    // Templates
    {
      id: 3,
      type: 'templates',
      title: t('resources.items.templates.title'),
      description: t('resources.items.templates.description'),
      category: t('resources.categories.templates'),
      categoryColor: 'purple',
      href: '/resources/templates',
      author: { name: 'Szabó Anna', avatar: '/avatars/szabo-anna.jpg' },
      downloadCount: '3.5K',
      publishDate: '2025. jan. 5.',
      tags: ['Sablonok', 'Ingyenes'],
      isPremium: false,
      featured: true,
      downloadable: true,
    },
    {
      id: 4,
      type: 'templates',
      title: t('resources.items.proTemplates.title'),
      description: t('resources.items.proTemplates.description'),
      category: t('resources.categories.templates'),
      categoryColor: 'purple',
      href: '/resources/pro-templates',
      author: { name: 'Tóth Mária', avatar: '/avatars/toth-maria.jpg' },
      downloadCount: '1.8K',
      publishDate: '2025. jan. 3.',
      tags: ['Sablonok', 'Premium'],
      isPremium: true,
      featured: false,
      downloadable: true,
    },
    // Articles/Blog
    {
      id: 5,
      type: 'articles',
      title: t('resources.items.tips.title'),
      description: t('resources.items.tips.description'),
      category: t('resources.categories.articles'),
      categoryColor: 'orange',
      href: '/resources/blog/10-tips',
      author: { name: 'Dr. Kovács Anna', avatar: '/avatars/kovacs-anna.jpg' },
      readTime: '6 perc',
      publishDate: '2025. jan. 12.',
      views: '2.1K',
      tags: ['Értékesítés', 'Best Practices'],
      isPremium: false,
      featured: true,
    },
    {
      id: 6,
      type: 'articles',
      title: t('resources.items.bestPractices.title'),
      description: t('resources.items.bestPractices.description'),
      category: t('resources.categories.articles'),
      categoryColor: 'orange',
      href: '/resources/blog/best-practices',
      author: { name: 'Varga László', avatar: '/avatars/varga-laszlo.jpg' },
      readTime: '9 perc',
      publishDate: '2025. jan. 6.',
      views: '1.5K',
      tags: ['Trend', 'Best Practices'],
      isPremium: false,
      featured: false,
    },
    // Videos
    {
      id: 7,
      type: 'videos',
      title: t('resources.items.introVideo.title'),
      description: t('resources.items.introVideo.description'),
      category: t('resources.categories.videos'),
      categoryColor: 'red',
      href: '/resources/videos/intro',
      duration: '5:30',
      publishDate: '2025. jan. 1.',
      views: '3.2K',
      tags: ['Kezdő', 'Tutorial'],
      isPremium: false,
      featured: true,
      isVideo: true,
    },
    {
      id: 8,
      type: 'videos',
      title: t('resources.items.fullTour.title'),
      description: t('resources.items.fullTour.description'),
      category: t('resources.categories.videos'),
      categoryColor: 'red',
      href: '/resources/videos/full-tour',
      duration: '18:45',
      publishDate: '2024. dec. 28.',
      views: '1.8K',
      tags: ['Haladó', 'Tutorial'],
      isPremium: false,
      featured: false,
      isVideo: true,
    },
  ];
}

// Featured content for hero section
const featuredContent = {
  type: 'guides',
  title: 'A tökéletes ajánlat anatómiája: 2025-ös útmutató',
  description:
    'Részletes, lépésről lépésre útmutató a magas konverziós arányú ajánlatok készítéséhez. Megtanulod az AI-alapú szöveggenerálás titkait, a vizuális tervezés alapjait, és a pszichológiai trükköket.',
  category: 'Útmutató',
  categoryColor: 'blue',
  author: {
    name: 'Dr. Kovács Anna',
    role: 'Sales stratéga',
    avatar: '/avatars/kovacs-anna.jpg',
  },
  stats: {
    readTime: '12 perc',
    publishDate: '2025. jan. 15.',
    views: '2.5K',
  },
  tags: ['Értékesítés', 'AI', 'Best Practices'],
  isPremium: true,
  href: '/resources/guide',
};

export default function ResourcesPage() {
  const { status } = useOptionalAuth();
  const isAuthenticated = status === 'authenticated';
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resources = getResources();

  const filteredResources = resources.filter((resource) => {
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const featuredResources = filteredResources.filter((r) => r.featured);
  const regularResources = filteredResources.filter((r) => !r.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Featured Content */}
      {/* Enhanced hero with large featured content showcase */}
      <section className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-blue-900 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-turquoise-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-turquoise-500/20 text-turquoise-300 rounded-full font-semibold text-sm mb-6 border border-turquoise-500/30">
              {t('resources.badge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              {t('resources.title')}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 text-pretty">
              {t('resources.description')}
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Keress útmutatók, cikkek, sablonok között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 text-lg rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur focus:bg-white/95 focus:text-gray-900 focus:border-turquoise-500 focus:outline-none focus:ring-4 focus:ring-turquoise-100 transition-all text-white placeholder-white/60 focus:placeholder-gray-400 min-h-[44px]"
              />
            </div>
          </div>

          {/* Featured Content Card */}
          {/* Large featured content showcase */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Side */}
                <div className="relative bg-gradient-to-br from-turquoise-500 to-blue-500 min-h-[400px]">
                  {/* Placeholder for featured image */}
                  <div className="absolute inset-0 bg-navy-900/20"></div>

                  {/* Premium Badge */}
                  {featuredContent.isPremium && (
                    <div className="absolute top-6 left-6 bg-yellow-400 text-navy-900 px-4 py-2 rounded-full font-bold text-sm inline-flex items-center gap-2">
                      <Star className="w-4 h-4" fill="currentColor" />
                      Premium tartalom
                    </div>
                  )}

                  {/* Stats Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-navy-900 font-semibold text-sm inline-flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {featuredContent.stats.views}
                    </div>
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-navy-900 font-semibold text-sm inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredContent.stats.readTime}
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-10 text-navy-900">
                  {/* Category Badge */}
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm mb-4 border border-blue-300">
                    🔥 Kiemelt {featuredContent.category}
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold mb-4 leading-tight text-balance">
                    {featuredContent.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed text-pretty">
                    {featuredContent.description}
                  </p>

                  {/* Author & Date */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div className="w-12 h-12 bg-turquoise-100 rounded-full flex items-center justify-center text-turquoise-700 font-bold text-lg">
                      {featuredContent.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{featuredContent.author.name}</div>
                      <div className="text-sm text-gray-600">{featuredContent.author.role}</div>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      {featuredContent.stats.publishDate}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredContent.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={featuredContent.href}
                    className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl min-h-[44px]"
                  >
                    {featuredContent.isPremium ? 'Letöltés (email szükséges)' : 'Olvass tovább'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      {/* Enhanced filtering with type and topic filters */}
      <section className="py-8 bg-gray-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Content Type Filter */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-700">Tartalom típusa:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all inline-flex items-center gap-2 min-h-[44px] ${
                      selectedType === type.id
                        ? 'bg-turquoise-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources Grid */}
      {/* Featured resources section */}
      {featuredResources.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-8 h-8 text-turquoise-600" />
                <h2 className="text-3xl font-bold text-navy-900">Népszerű tartalmak</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-200 overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    <div className="relative bg-gradient-to-br from-turquoise-500 to-blue-500 h-48 flex items-center justify-center">
                      {/* Placeholder for thumbnail */}
                      <div className="absolute inset-0 bg-navy-900/20"></div>

                      {/* Category Badge */}
                      <div
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                          resource.categoryColor === 'blue'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : resource.categoryColor === 'purple'
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : resource.categoryColor === 'orange'
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {resource.category}
                      </div>

                      {/* Video Play Button */}
                      {resource.isVideo && (
                        <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                          <Play className="w-7 h-7 text-turquoise-600 ml-1" fill="currentColor" />
                        </div>
                      )}

                      {/* Premium Badge */}
                      {resource.isPremium && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-navy-900 px-2 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Pro
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-navy-900 mb-3 leading-tight group-hover:text-turquoise-600 transition-colors text-balance">
                        {resource.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 text-pretty">
                        {resource.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                        {resource.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {resource.author.name}
                          </div>
                        )}
                        {resource.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.readTime}
                          </div>
                        )}
                        {resource.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.duration}
                          </div>
                        )}
                        {resource.views && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {resource.views}
                          </div>
                        )}
                        {resource.downloadCount && (
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {resource.downloadCount}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {resource.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={resource.href}
                        className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-3 rounded-xl transition-all inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {resource.downloadable ? (
                          <>
                            <Download className="w-4 h-4" />
                            Letöltés
                          </>
                        ) : resource.isVideo ? (
                          <>
                            <Play className="w-4 h-4" />
                            Megtekintés
                          </>
                        ) : (
                          <>
                            Olvasás
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Resources Grid */}
      {/* Complete resources grid with better organization */}
      {regularResources.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-navy-900 mb-8 text-balance">
                Összes erőforrás ({regularResources.length})
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    <div className="relative bg-gradient-to-br from-gray-500 to-gray-700 h-40 flex items-center justify-center">
                      <div className="absolute inset-0 bg-navy-900/10"></div>

                      {/* Category Badge */}
                      <div
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                          resource.categoryColor === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : resource.categoryColor === 'purple'
                              ? 'bg-purple-100 text-purple-700'
                              : resource.categoryColor === 'orange'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {resource.category}
                      </div>

                      {resource.isVideo && <Play className="w-12 h-12 text-white opacity-80" />}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-navy-900 mb-2 leading-tight line-clamp-2 text-balance">
                        {resource.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 text-pretty">
                        {resource.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                        {resource.readTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.readTime}
                          </div>
                        )}
                        {resource.duration && (
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            {resource.duration}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={resource.href}
                        className="w-full bg-gray-100 hover:bg-turquoise-600 hover:text-white text-gray-700 font-semibold py-2 rounded-lg transition-all text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {resource.downloadable
                          ? 'Letöltés'
                          : resource.isVideo
                            ? 'Megtekintés'
                            : 'Olvasás'}
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
                  setSelectedType('all');
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
      {/* Content-focused newsletter signup */}
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
      {/* Action-focused CTA for trial signup */}
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
