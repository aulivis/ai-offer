'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  BoltIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Mock data for templates - in production, fetch from API
const mockTemplates = [
  {
    id: 'free.minimal',
    name: 'Minimális',
    label: 'Minimális',
    description:
      'Tiszta, professzionális dizájn, amely tökéletesen megfelel az üzleti ajánlatokhoz. Egyszerű és elegáns.',
    category: 'Általános',
    tags: ['minimális', 'professzionális', 'egyszerű'],
    preview: '/templates/minimal-preview.png',
    features: ['Árazási táblázat', 'Logó támogatás', 'Egyedi színek'],
    tier: 'free' as const,
    downloads: 2450,
    rating: 4.9,
    isPopular: true,
    isNew: false,
  },
  {
    id: 'free.modern',
    name: 'Modern Üzleti',
    label: 'Modern Üzleti',
    description: 'Szemet gyönyörködtető, modern design céges ajánlatokhoz',
    category: 'Üzleti',
    tags: ['modern', 'üzleti'],
    preview: '/templates/modern-preview.png',
    features: ['Modern layout', 'Interaktív elemek'],
    tier: 'free' as const,
    downloads: 1890,
    rating: 4.7,
    isPopular: false,
    isNew: true,
  },
  {
    id: 'free.classic',
    name: 'Klasszikus',
    label: 'Klasszikus',
    description: 'Időtálló, elegáns sablon hagyományos üzleti ajánlatokhoz',
    category: 'Üzleti',
    tags: ['klasszikus', 'elegáns'],
    preview: '/templates/classic-preview.png',
    features: ['Klasszikus stílus', 'Professzionális'],
    tier: 'free' as const,
    downloads: 1200,
    rating: 4.6,
    isPopular: false,
    isNew: false,
  },
  {
    id: 'free.creative',
    name: 'Kreatív',
    label: 'Kreatív',
    description: 'Vibráns és egyedi dizájn kreatív ügynökségeknek',
    category: 'Kreatív',
    tags: ['kreatív', 'színes'],
    preview: '/templates/creative-preview.png',
    features: ['Kreatív layout', 'Színes dizájn'],
    tier: 'free' as const,
    downloads: 980,
    rating: 4.5,
    isPopular: false,
    isNew: false,
  },
  {
    id: 'free.marketing',
    name: 'Marketing',
    label: 'Marketing',
    description: 'Professzionális sablon marketing ajánlatokhoz',
    category: 'Marketing',
    tags: ['marketing', 'professzionális'],
    preview: '/templates/marketing-preview.png',
    features: ['Marketing fókusz', 'ROI kalkulátor'],
    tier: 'free' as const,
    downloads: 1650,
    rating: 4.8,
    isPopular: true,
    isNew: false,
  },
  {
    id: 'free.tech',
    name: 'Tech Start-up',
    label: 'Tech Start-up',
    description: 'Modern, tech-orientált sablon start-upoknak',
    category: 'Tech',
    tags: ['tech', 'start-up'],
    preview: '/templates/tech-preview.png',
    features: ['Tech stílus', 'Modern'],
    tier: 'free' as const,
    downloads: 2100,
    rating: 4.7,
    isPopular: true,
    isNew: false,
  },
  {
    id: 'free.consulting',
    name: 'Tanácsadás',
    label: 'Tanácsadás',
    description: 'Professzionális sablon tanácsadói szolgáltatásokhoz',
    category: 'Tanácsadás',
    tags: ['tanácsadás', 'professzionális'],
    preview: '/templates/consulting-preview.png',
    features: ['Tanácsadás fókusz', 'Elegáns'],
    tier: 'free' as const,
    downloads: 1350,
    rating: 4.6,
    isPopular: false,
    isNew: false,
  },
  {
    id: 'free.webdev',
    name: 'Webfejlesztés',
    label: 'Webfejlesztés',
    description: 'Sablon webfejlesztési projektekhez',
    category: 'Tech',
    tags: ['webfejlesztés', 'tech'],
    preview: '/templates/webdev-preview.png',
    features: ['Tech fókusz', 'Projekt alapú'],
    tier: 'free' as const,
    downloads: 1100,
    rating: 4.5,
    isPopular: false,
    isNew: false,
  },
];

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'newest' | 'rating' | 'downloads';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(mockTemplates.map((t) => t.category));
    return Array.from(cats);
  }, []);

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = [...mockTemplates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          t.category.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Style filter (based on tags)
    if (selectedStyle !== 'all') {
      filtered = filtered.filter((t) =>
        t.tags.some((tag) => tag.toLowerCase() === selectedStyle.toLowerCase()),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || b.downloads - a.downloads;
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedStyle, sortBy]);

  return (
    <main id="main" className="w-full">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 py-16 md:py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-teal-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/resources" className="hover:text-teal-600 transition-colors">
                  Erőforrások
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Ingyenes sablonok</li>
            </ol>
          </nav>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-teal-600" />
              <span className="bg-gradient-to-r from-teal-600 to-purple-600 text-white text-sm px-4 py-1.5 rounded-full font-semibold">
                SABLONOK
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Ingyenes ajánlat sablonok
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Bárhogy használd a professzionális ajánlat sablonokat. Minden sablon testre szabható
              és azonnal használható. Az ajánlat készítés egyszerű.
            </p>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">{mockTemplates.length}+</div>
                <div className="text-sm text-gray-600">Sablon</div>
              </div>
              <div className="w-px h-12 bg-gray-300 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  {mockTemplates.reduce((sum, t) => sum + t.downloads, 0).toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600">Letöltés</div>
              </div>
              <div className="w-px h-12 bg-gray-300 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  {(
                    mockTemplates.reduce((sum, t) => sum + t.rating, 0) / mockTemplates.length
                  ).toFixed(1)}
                  ★
                </div>
                <div className="text-sm text-gray-600">Értékelés</div>
              </div>
            </div>

            {/* Quick filter/search */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Keress sablonokat neve, iparág vagy típus szerint..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-2 py-3 outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>
                <button className="bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors whitespace-nowrap">
                  Keresés
                </button>
              </div>

              {/* Popular tags */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-gray-600">Népszerű:</span>
                {['Minimális', 'Modern', 'Üzleti', 'Kreatív'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedStyle(tag.toLowerCase());
                      setSearchQuery('');
                    }}
                    className={`text-sm border px-3 py-1 rounded-full transition-colors ${
                      selectedStyle === tag.toLowerCase()
                        ? 'border-teal-500 text-teal-600 bg-teal-50'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and sort bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Összes sablon{' '}
              <span className="text-gray-500 font-normal">
                ({filteredAndSortedTemplates.length})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all text-sm"
            >
              <option value="all">Minden kategória</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Style filter */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all text-sm"
            >
              <option value="all">Minden stílus</option>
              <option value="minimális">Minimális</option>
              <option value="modern">Modern</option>
              <option value="klasszikus">Klasszikus</option>
              <option value="kreatív">Kreatív</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all text-sm"
            >
              <option value="popular">Legnépszerűbb</option>
              <option value="newest">Legújabb</option>
              <option value="downloads">Legtöbb letöltés</option>
              <option value="rating">Legmagasabb értékelés</option>
            </select>

            {/* View toggle */}
            <div className="flex gap-1 border-2 border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 bg-white">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Kategóriák szerint böngészd</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Üzleti', count: 24, color: 'from-blue-500 to-blue-600' },
            { name: 'Marketing', count: 18, color: 'from-purple-500 to-purple-600' },
            { name: 'Tech', count: 12, color: 'from-teal-500 to-teal-600' },
            { name: 'Kreatív', count: 8, color: 'from-pink-500 to-pink-600' },
          ].map((category) => (
            <a
              key={category.name}
              href={`#${category.name.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory(category.name);
                setSearchQuery('');
              }}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
            >
              <div
                className={`w-full h-full bg-gradient-to-br ${category.color} flex items-end p-6`}
              >
                <div className="w-full">
                  <h3 className="text-white font-bold text-xl mb-1">{category.name}</h3>
                  <p className="text-white/80 text-sm">{category.count} sablon</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </a>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              Nem található sablon a keresési feltételeknek megfelelően.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredAndSortedTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden border-2 border-transparent hover:border-teal-500"
              >
                {/* Badge */}
                {(template.isPopular || template.isNew) && (
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    {template.isPopular && (
                      <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                        NÉPSZERŰ
                      </span>
                    )}
                    {template.isNew && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                        Új
                      </span>
                    )}
                  </div>
                )}

                {/* Template preview image */}
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400" />
                  </div>

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-4 gap-2">
                    <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                      <EyeIcon className="w-4 h-4" />
                      <span>Előnézet</span>
                    </button>
                    <Link
                      href="/login?redirect=/new"
                      className="w-full bg-teal-500 text-white py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Használat</span>
                    </Link>
                  </div>
                </div>

                {/* Template info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <ArrowDownTrayIcon className="w-3 h-3" />
                      <span>{template.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIconSolid className="w-3 h-3 text-yellow-400" />
                      <span>{template.rating}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {filteredAndSortedTemplates.length >= 8 && (
          <div className="flex justify-center mt-12">
            <button className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center gap-2">
              <span>Több sablon betöltése</span>
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* How to use templates section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hogyan használd a sablonokat?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Három egyszerű lépésben professzionális ajánlatot készíthetsz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Válassz sablont
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Böngéssz az elérhető sablonok közül, és válaszd ki azt, amelyik a legjobban
                  illeszkedik az üzleti igényeidhez
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Testre szabás</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Add meg a saját tartalmat, válassz színeket, logót. Az AI segít a szöveg
                  megírásában
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  Exportáld PDF-be
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Töltsd le az ajánlatot PDF formátumban vagy küldd el közvetlenül az ügyfélnek
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why choose section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Miért válaszd a Vyndi sablonokat?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professzionális eszközök a sikeres ajánlatkészítéshez
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border-2 border-teal-200 hover:border-teal-400 transition-all group">
            <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BoltIcon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Professzionális dizájn</h3>
            <p className="text-gray-700 leading-relaxed">
              Dizájnerek által megtervezett sablonok, amelyek jó benyomást keltenek és segítik a
              világos üzenetátadást
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all group">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Squares2X2Icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Teljes testreszabhatóság</h3>
            <p className="text-gray-700 leading-relaxed">
              Módosítsd a színeket, az elrendezést és minden tartalmat. Nincs két egyforma ajánlat
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all group">
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BoltIcon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI segítség</h3>
            <p className="text-gray-700 leading-relaxed">
              Használd az AI-t a tartalom létrehozásához és a professzionális szövegezés
              támogatásához
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-orange-200 hover:border-orange-400 transition-all group">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BoltIcon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Gyors és egyszerű</h3>
            <p className="text-gray-700 leading-relaxed">
              Percek alatt hozhatod létre a professzionális ajánlatot. Nincs szükség előzetes
              tapasztalatra
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Mit mondanak a felhasználók?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                &ldquo;A sablonok fantasztikusak! Percek alatt professzionális ajánlatot tudtam
                készíteni.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                  KJ
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Kovács János</div>
                  <div className="text-sm text-gray-600">Marketing ügynökség tulajdonos</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                &ldquo;Nagyon könnyen használható és szép eredményt ad. Az AI funkció különösen
                hasznos volt.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  NS
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Nagy Szilvia</div>
                  <div className="text-sm text-gray-600">Webfejlesztő</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                &ldquo;A legjobb ajánlatkészítő eszköz, amit használtam. Időt takarít meg és
                professzionális eredményt ad.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  PT
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Péter Tamás</div>
                  <div className="text-sm text-gray-600">Tanácsadó</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Gyakran ismételt kérdések
          </h2>

          <div className="space-y-4">
            {[
              {
                question: 'Ingyenesek a sablonok?',
                answer:
                  'Igen, az összes alap sablon teljesen ingyenes. Prémium sablonokhoz Pro előfizetés szükséges.',
              },
              {
                question: 'Hogyan használhatom a sablonokat?',
                answer:
                  'Egyszerűen válassz egy sablont, add meg a saját tartalmaidat, és töltsd le PDF formátumban. Az AI segít a szöveg generálásában.',
              },
              {
                question: 'Testreszabhatom a sablonokat?',
                answer:
                  'Igen, minden sablon teljesen testreszabható. Módosíthatod a színeket, logót, szövegeket és az elrendezést is.',
              },
              {
                question: 'Milyen formátumban exportálhatom az ajánlatot?',
                answer:
                  'Az ajánlatokat PDF formátumban exportálhatod, amely tökéletesen megfelel a nyomtatáshoz és megosztáshoz.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-left">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 text-gray-700 leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA section */}
      <div className="relative bg-gradient-to-br from-teal-500 via-blue-600 to-purple-700 py-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Kezdd el még ma!</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Regisztrálj ingyenesen, és azonnal hozzáférhet az összes ingyenes sablonhoz
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-8 text-white flex-wrap">
            <div>
              <div className="text-3xl font-bold">Ingyenes</div>
              <div className="text-white/80 text-sm">Nincs rejtett költség</div>
            </div>
            <div className="w-px h-12 bg-white/30 hidden sm:block"></div>
            <div>
              <div className="text-3xl font-bold">2 perc</div>
              <div className="text-white/80 text-sm">Gyors regisztráció</div>
            </div>
            <div className="w-px h-12 bg-white/30 hidden sm:block"></div>
            <div>
              <div className="text-3xl font-bold">Azonnal</div>
              <div className="text-white/80 text-sm">Használható</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?redirect=/new"
              className="bg-white text-teal-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>Ingyenes próba indítása</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/resources/pro-templates"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Próbálj ki egy sablont
            </Link>
          </div>

          <p className="text-white/70 text-sm mt-6">
            ✓ Nincs bankkártya szükséges &nbsp; • &nbsp; ✓ Bármikor lemondható
          </p>
        </div>
      </div>

      {/* Related Resources */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Kapcsolódó erőforrások</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/resources/guide">
            <Card className="group h-full border-2 border-gray-200 transition-all hover:border-teal-500 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                    Ajánlatkészítési útmutató
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tanuld meg, hogyan készíts tökéletes ajánlatokat.
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
          <Link href="/resources/ai-guide">
            <Card className="group h-full border-2 border-gray-200 transition-all hover:border-teal-500 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                    AI-alapú szöveg generálás
                  </h3>
                  <p className="text-sm text-gray-600">
                    Használd az AI-t a sablonokhoz szövegek generálásához.
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
