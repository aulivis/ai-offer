'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  FileText,
  Newspaper,
  PlayCircle,
  Layout,
  Clock,
  Play,
  Download,
} from 'lucide-react';
import { Resource, ResourceType } from '@/types/resource';

interface ResourceCardProps {
  resource: Resource;
}

const typeConfig: Record<ResourceType, { label: string; icon: typeof FileText; gradient: string }> =
  {
    guide: {
      label: 'Útmutató',
      icon: FileText,
      gradient: 'from-primary via-primary/90 to-accent',
    },
    blog: {
      label: 'Blog',
      icon: Newspaper,
      gradient: 'from-primary to-primary/70',
    },
    video: {
      label: 'Videó',
      icon: PlayCircle,
      gradient: 'from-accent to-primary/80',
    },
    template: {
      label: 'Sablon',
      icon: Layout,
      gradient: 'from-success to-primary',
    },
  };

const difficultyStyles: Record<string, string> = {
  Kezdő: 'bg-success/10 text-success',
  Haladó: 'bg-warning/15 text-warning',
  default: 'bg-danger/10 text-danger',
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const config = typeConfig[resource.type];
  const Icon = config.icon;
  const isVideo = resource.type === 'video';

  // Determine CTA text and icon
  const getCTAContent = () => {
    if (isVideo) {
      return { text: 'Megnézem', icon: Play };
    }
    if (resource.downloadable) {
      return { text: 'Letöltöm', icon: Download };
    }
    return { text: 'Elolvasom', icon: ArrowRight };
  };

  const ctaContent = getCTAContent();
  const CTAIcon = ctaContent.icon;

  return (
    <Link href={resource.href || `/resources/${resource.type}s/${resource.slug}`}>
      <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-border h-full flex flex-col">
        {/* Video Card - different styling with thumbnail at top */}
        {isVideo && resource.featuredImage ? (
          <>
            <div className={`relative aspect-video bg-gradient-to-br ${config.gradient}`}>
              <Image
                src={resource.featuredImage}
                alt={resource.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-accent ml-1" />
                </div>
              </div>
              {/* Duration badge */}
              {resource.videoDuration && (
                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {resource.videoDuration < 60
                    ? `${Math.floor(resource.videoDuration)}:${String(Math.round((resource.videoDuration % 1) * 60)).padStart(2, '0')}`
                    : `${Math.floor(resource.videoDuration / 60)}:${String(Math.floor(resource.videoDuration % 60)).padStart(2, '0')}`}
                </div>
              )}
            </div>
            {/* Card Content for Video */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-2 text-fg group-hover:text-primary transition-colors line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-fg-muted text-sm mb-4 line-clamp-2 flex-1">
                {resource.excerpt || resource.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-fg-muted mb-4">
                {resource.videoDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{resource.videoDuration} perc</span>
                  </div>
                )}
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    difficultyStyles[resource.difficulty] || difficultyStyles.default
                  }`}
                >
                  {resource.difficulty}
                </span>
              </div>
              <div className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
                {ctaContent.text}
                <CTAIcon className="w-4 h-4" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header with gradient accent - smaller, just a top bar */}
            <div className={`h-2 bg-gradient-to-r ${config.gradient}`}></div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col">
              {/* Icon and badges section */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex gap-2">
                  {resource.featured && (
                    <span className="bg-success/10 text-success text-xs px-3 py-1 rounded-full font-semibold">
                      Új
                    </span>
                  )}
                  {resource.isPremium && (
                    <span className="bg-warning/20 text-warning text-xs px-3 py-1 rounded-full font-bold">
                      PRO
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 text-fg group-hover:text-primary transition-colors line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-fg-muted text-sm mb-4 line-clamp-2 flex-1">
                {resource.excerpt || resource.description}
              </p>

              {/* Metadata - more organized */}
              <div className="flex items-center gap-4 text-sm text-fg-muted mb-4">
                {resource.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{resource.readingTime} perc</span>
                  </div>
                )}
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    difficultyStyles[resource.difficulty] || difficultyStyles.default
                  }`}
                >
                  {resource.difficulty}
                </span>
              </div>

              {/* Tags - smaller, less prominent */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs bg-bg-muted text-fg-muted px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA - full width, action-specific */}
              <div className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
                {ctaContent.text}
                {CTAIcon === ArrowRight ? (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <CTAIcon className="w-4 h-4" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
