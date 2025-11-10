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
  Eye,
  Star,
  Play,
  Bookmark,
} from 'lucide-react';
import { Resource, ResourceType } from '@/types/resource';

interface ResourceCardProps {
  resource: Resource;
}

const typeConfig: Record<ResourceType, { label: string; icon: typeof FileText; color: string }> = {
  guide: { label: 'Útmutató', icon: FileText, color: 'bg-turquoise-500' },
  blog: { label: 'Blog', icon: Newspaper, color: 'bg-blue-500' },
  video: { label: 'Videó', icon: PlayCircle, color: 'bg-purple-500' },
  template: { label: 'Sablon', icon: Layout, color: 'bg-green-500' },
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const config = typeConfig[resource.type];
  const Icon = config.icon;

  return (
    <Link href={resource.href || `/resources/${resource.type}s/${resource.slug}`}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group h-full flex flex-col">
        {/* Image/Visual Header */}
        <div
          className={`relative h-48 ${config.color} bg-gradient-to-br from-current to-current/80 flex items-center justify-center overflow-hidden`}
        >
          {resource.featuredImage ? (
            <Image
              src={resource.featuredImage}
              alt={resource.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Icon className="w-16 h-16 text-white/40" />
          )}

          {/* Featured Badge */}
          {resource.featured && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Kiemelt
              </span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-white/90 backdrop-blur text-navy-900 rounded-full text-xs font-bold">
              {config.label}
            </span>
          </div>

          {/* Video Play Overlay */}
          {resource.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-turquoise-600 ml-1" />
              </div>
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

        {/* Card Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-xl font-bold text-navy-900 mb-3 leading-tight group-hover:text-turquoise-600 transition-colors line-clamp-2">
            {resource.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 flex-1">
            {resource.excerpt || resource.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            {resource.readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {resource.readingTime} perc
              </div>
            )}
            {resource.videoDuration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {resource.videoDuration} perc
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {resource.views}
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-semibold ${
                resource.difficulty === 'Kezdő'
                  ? 'bg-green-100 text-green-700'
                  : resource.difficulty === 'Haladó'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {resource.difficulty}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Date */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">{resource.publishedDate}</div>

            {/* Bookmark Icon */}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement bookmark functionality
              }}
            >
              <Bookmark className="w-5 h-5 text-gray-400 hover:text-turquoise-600" />
            </button>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="px-6 pb-6">
          <div className="w-full bg-turquoise-600 hover:bg-turquoise-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group min-h-[44px]">
            {resource.type === 'video'
              ? 'Megnézem'
              : resource.downloadable
                ? 'Letöltés'
                : 'Elolvasom'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
