'use client';

import Link from 'next/link';
import { Video, ChevronRight, Play } from 'lucide-react';

interface PlaylistItem {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  slug: string;
}

interface VideoSeriesProps {
  playlist: PlaylistItem[];
  currentSlug: string;
  currentIndex: number;
}

export function VideoSeries({ playlist, currentSlug, currentIndex }: VideoSeriesProps) {
  const totalVideos = playlist.length;
  const watchedVideos = currentIndex;
  const progressPercent = (watchedVideos / totalVideos) * 100;

  return (
    <div className="bg-bg-muted rounded-2xl border-2 border-border overflow-hidden">
      <div className="bg-bg px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold text-fg">Ebből a sorozatból</h2>
      </div>

      <div className="divide-y divide-border">
        {playlist.map((video, index) => {
          const isCurrent = video.slug === currentSlug;
          const isNext = index === currentIndex && !isCurrent;
          const isWatched = index < currentIndex - 1;

          return (
            <Link
              key={video.id}
              href={`/resources/videos/${video.slug}`}
              className={`flex items-center gap-4 p-5 transition-colors group ${
                isCurrent ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-bg'
              }`}
            >
              <div className="flex-shrink-0">
                {isCurrent ? (
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-ink" />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isWatched ? 'bg-success/20' : 'bg-bg group-hover:bg-primary/20'
                    }`}
                  >
                    <Video
                      className={`w-6 h-6 transition-colors ${
                        isWatched ? 'text-success' : 'text-fg-muted group-hover:text-primary'
                      }`}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      isCurrent ? 'bg-primary text-primary-ink' : 'bg-border text-fg'
                    }`}
                  >
                    {index + 1}/{totalVideos}
                  </span>
                  {isCurrent && (
                    <span className="text-primary text-sm font-semibold">MOST NÉZI</span>
                  )}
                  {isNext && <span className="text-fg-muted text-sm font-semibold">KÖVETKEZŐ</span>}
                </div>
                <h3
                  className={`font-bold mb-1 transition-colors ${
                    isCurrent ? 'text-fg' : 'text-fg group-hover:text-primary'
                  }`}
                >
                  {video.title}
                </h3>
                <p className="text-sm text-fg-muted">
                  {isCurrent
                    ? 'Kezdje meg a munkát az anyaggal találkozást'
                    : 'Rövid leírás a videóról és annak tartalmáról'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-fg-muted font-medium">{video.duration}</span>
                <ChevronRight
                  className={`w-5 h-5 transition-colors ${
                    isCurrent ? 'text-primary' : 'text-fg-muted group-hover:text-primary'
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Series progress indicator */}
      <div className="bg-bg p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-fg-muted mb-2">
          <span className="font-semibold">Sorozat előrehaladása</span>
          <span className="font-semibold">
            {watchedVideos}/{totalVideos} videó megtekintve
          </span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
