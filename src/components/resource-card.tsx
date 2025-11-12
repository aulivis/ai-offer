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
      gradient: 'from-teal-400 to-blue-500',
    },
    blog: {
      label: 'Blog',
      icon: Newspaper,
      gradient: 'from-blue-400 to-indigo-500',
    },
    video: {
      label: 'Videó',
      icon: PlayCircle,
      gradient: 'from-purple-400 to-pink-500',
    },
    template: {
      label: 'Sablon',
      icon: Layout,
      gradient: 'from-green-400 to-emerald-500',
    },
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
      <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100 h-full flex flex-col">
        {/* Video Card - different styling with thumbnail at top */}
        {isVideo && resource.featuredImage ? (
          <>
            <div className="relative aspect-video bg-gradient-to-br from-purple-400 to-pink-500">
              <Image
                src={resource.featuredImage}
                alt={resource.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-purple-600 ml-1" />
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
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                {resource.excerpt || resource.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                {resource.videoDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{resource.videoDuration} perc</span>
                  </div>
                )}
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    resource.difficulty === 'Kezdő'
                      ? 'bg-green-100 text-green-700'
                      : resource.difficulty === 'Haladó'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {resource.difficulty}
                </span>
              </div>
              <div className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
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
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                      Új
                    </span>
                  )}
                  {resource.isPremium && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold">
                      PRO
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                {resource.excerpt || resource.description}
              </p>

              {/* Metadata - more organized */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                {resource.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{resource.readingTime} perc</span>
                  </div>
                )}
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    resource.difficulty === 'Kezdő'
                      ? 'bg-green-100 text-green-700'
                      : resource.difficulty === 'Haladó'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {resource.difficulty}
                </span>
              </div>

              {/* Tags - smaller, less prominent */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA - full width, action-specific */}
              <div className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
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
