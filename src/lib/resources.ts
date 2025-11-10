import { Resource } from '@/types/resource';
import { t } from '@/copy';

export function getResources(): Resource[] {
  return [
    // Guides
    {
      id: '1',
      slug: 'perfect-proposal-anatomy-2025',
      type: 'guide',
      title: t('resources.items.guide.title'),
      description: t('resources.items.guide.description'),
      excerpt:
        'Részletes, lépésről lépésre útmutató a magas konverziós arányú ajánlatok készítéséhez.',
      category: t('resources.categories.guides'),
      categoryColor: 'blue',
      href: '/resources/guides/perfect-proposal-anatomy-2025',
      readingTime: 12,
      publishedDate: '2025. jan. 10.',
      views: 2500,
      difficulty: 'Kezdő',
      tags: ['Kezdő', 'Útmutató', 'Best Practices'],
      categories: ['Útmutatók'],
      featured: true,
      isPremium: false,
    },
    {
      id: '2',
      slug: 'ai-powered-proposal-guide',
      type: 'guide',
      title: t('resources.items.aiGuide.title'),
      description: t('resources.items.aiGuide.description'),
      excerpt:
        'Ismerd meg, hogyan használd az AI-t az ajánlatkészítésben a hatékonyság növelésére.',
      category: t('resources.categories.guides'),
      categoryColor: 'blue',
      href: '/resources/guides/ai-powered-proposal-guide',
      readingTime: 10,
      publishedDate: '2025. jan. 8.',
      views: 980,
      difficulty: 'Haladó',
      tags: ['AI', 'Haladó', 'Automatizálás'],
      categories: ['Útmutatók'],
      featured: true,
      isPremium: false,
    },
    // Templates
    {
      id: '3',
      slug: 'free-proposal-templates',
      type: 'template',
      title: t('resources.items.templates.title'),
      description: t('resources.items.templates.description'),
      excerpt: 'Ingyenes, professzionális ajánlat sablonok azonnali használatra.',
      category: t('resources.categories.templates'),
      categoryColor: 'purple',
      href: '/resources/templates',
      publishedDate: '2025. jan. 5.',
      views: 3500,
      difficulty: 'Kezdő',
      tags: ['Sablonok', 'Ingyenes'],
      categories: ['Sablonok'],
      featured: true,
      downloadable: true,
      downloadCount: '3.5K',
      isPremium: false,
    },
    {
      id: '4',
      slug: 'premium-proposal-templates',
      type: 'template',
      title: t('resources.items.proTemplates.title'),
      description: t('resources.items.proTemplates.description'),
      excerpt: 'Prémium sablonok haladó funkciókkal és testreszabási lehetőségekkel.',
      category: t('resources.categories.templates'),
      categoryColor: 'purple',
      href: '/resources/pro-templates',
      publishedDate: '2025. jan. 3.',
      views: 1800,
      difficulty: 'Haladó',
      tags: ['Sablonok', 'Premium'],
      categories: ['Sablonok'],
      featured: false,
      downloadable: true,
      downloadCount: '1.8K',
      isPremium: true,
    },
    // Articles/Blog
    {
      id: '5',
      slug: '10-tips-for-better-proposals',
      type: 'blog',
      title: t('resources.items.tips.title'),
      description: t('resources.items.tips.description'),
      excerpt: '10 praktikus tipp, amelyek segítenek növelni az ajánlatok elfogadási arányát.',
      category: t('resources.categories.articles'),
      categoryColor: 'orange',
      href: '/resources/blogs/10-tips-for-better-proposals',
      readingTime: 6,
      publishedDate: '2025. jan. 12.',
      views: 2100,
      difficulty: 'Kezdő',
      tags: ['Értékesítés', 'Best Practices'],
      categories: ['Blog cikkek'],
      featured: true,
      isPremium: false,
    },
    {
      id: '6',
      slug: 'best-practices-2025',
      type: 'blog',
      title: t('resources.items.bestPractices.title'),
      description: t('resources.items.bestPractices.description'),
      excerpt: 'A legújabb trendek és bevált gyakorlatok az ajánlatkészítésben 2025-ben.',
      category: t('resources.categories.articles'),
      categoryColor: 'orange',
      href: '/resources/blogs/best-practices-2025',
      readingTime: 9,
      publishedDate: '2025. jan. 6.',
      views: 1500,
      difficulty: 'Haladó',
      tags: ['Trend', 'Best Practices'],
      categories: ['Blog cikkek'],
      featured: false,
      isPremium: false,
    },
    // Videos
    {
      id: '7',
      slug: 'getting-started-with-vyndi',
      type: 'video',
      title: t('resources.items.introVideo.title'),
      description: t('resources.items.introVideo.description'),
      excerpt: 'Bevezető videó a Vyndi használatának alapjairól.',
      category: t('resources.categories.videos'),
      categoryColor: 'red',
      href: '/resources/videos/getting-started-with-vyndi',
      videoDuration: 5,
      publishedDate: '2025. jan. 1.',
      views: 3200,
      difficulty: 'Kezdő',
      tags: ['Kezdő', 'Tutorial'],
      categories: ['Videók'],
      featured: true,
      isVideo: true,
      isPremium: false,
    },
    {
      id: '8',
      slug: 'complete-vyndi-tour',
      type: 'video',
      title: t('resources.items.fullTour.title'),
      description: t('resources.items.fullTour.description'),
      excerpt: 'Teljes bemutató a Vyndi összes funkciójáról.',
      category: t('resources.categories.videos'),
      categoryColor: 'red',
      href: '/resources/videos/complete-vyndi-tour',
      videoDuration: 18,
      publishedDate: '2024. dec. 28.',
      views: 1800,
      difficulty: 'Haladó',
      tags: ['Haladó', 'Tutorial'],
      categories: ['Videók'],
      featured: false,
      isVideo: true,
      isPremium: false,
    },
  ];
}

export function getResourceBySlug(type: string, slug: string): Resource | undefined {
  return getResources().find((r) => r.slug === slug && r.type === type);
}

export function getFeaturedResource(): Resource | undefined {
  return getResources().find((r) => r.featured && r.type === 'guide');
}

export function getRelatedResources(currentSlug: string, limit: number = 3): Resource[] {
  const current = getResources().find((r) => r.slug === currentSlug);
  if (!current) return [];

  return getResources()
    .filter(
      (r) =>
        r.slug !== currentSlug &&
        (r.categories.some((c) => current.categories.includes(c)) ||
          r.tags.some((t) => current.tags.includes(t))),
    )
    .slice(0, limit);
}
