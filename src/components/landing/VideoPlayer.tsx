'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title = 'Product Demo',
  className = '',
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoUrl && !thumbnailUrl) {
    // Placeholder for demo video
    return (
      <div
        className={`relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 shadow-pop ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
              <svg
                className="ml-1 h-10 w-10 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-fg-muted">TermĂ©k bemutatĂł videĂł</p>
            <p className="mt-1 text-xs text-fg-muted">Kattints a lejĂˇtszĂˇshoz</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,176,0.08),transparent_70%)]" />
      </div>
    );
  }

  if (isPlaying && videoUrl) {
    return (
      <div className={`relative aspect-video overflow-hidden rounded-2xl ${className}`}>
        <iframe
          src={videoUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className={`group relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 shadow-pop transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${className}`}
      aria-label={`LejĂˇtszĂˇs: ${title}`}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-black/30">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
          <svg
            className="ml-1 h-10 w-10 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,176,0.08),transparent_70%)]" />
    </button>
  );
}

