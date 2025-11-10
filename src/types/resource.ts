export type ResourceType = 'guide' | 'blog' | 'video' | 'template';

export type Difficulty = 'Kezdő' | 'Haladó' | 'Szakértő';

export interface Resource {
  id: string;
  slug: string;
  type: ResourceType;
  title: string;
  description: string;
  excerpt: string;
  content?: string; // Full content for articles/guides
  featuredImage?: string;
  publishedDate: string;
  updatedDate?: string;
  readingTime?: number; // in minutes
  videoDuration?: number; // in minutes for videos
  views: number;
  difficulty: Difficulty;
  tags: string[];
  categories: string[];
  featured: boolean;

  // For videos
  videoUrl?: string;
  transcript?: string;
  playlist?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Related content
  relatedResources?: string[]; // slugs

  // Legacy support
  category?: string;
  categoryColor?: string;
  href?: string;
  isPremium?: boolean;
  downloadable?: boolean;
  downloadCount?: string;
  isVideo?: boolean;
}
