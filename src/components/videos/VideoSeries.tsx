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
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Ebből a sorozatból</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {playlist.map((video, index) => {
          const isCurrent = video.slug === currentSlug;
          const isNext = index === currentIndex && !isCurrent;
          const isWatched = index < currentIndex - 1;

          return (
            <Link
              key={video.id}
              href={`/resources/videos/${video.slug}`}
              className={`flex items-center gap-4 p-5 transition-colors group ${
                isCurrent ? 'bg-teal-50 border-l-4 border-teal-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                {isCurrent ? (
                  <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isWatched ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-teal-100'
                    }`}
                  >
                    <Video
                      className={`w-6 h-6 transition-colors ${
                        isWatched ? 'text-green-600' : 'text-gray-600 group-hover:text-teal-600'
                      }`}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      isCurrent ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {index + 1}/{totalVideos}
                  </span>
                  {isCurrent && (
                    <span className="text-teal-700 text-sm font-semibold">MOST NÉZI</span>
                  )}
                  {isNext && <span className="text-gray-500 text-sm font-semibold">KÖVETKEZŐ</span>}
                </div>
                <h3
                  className={`font-bold mb-1 transition-colors ${
                    isCurrent ? 'text-gray-900' : 'text-gray-900 group-hover:text-teal-600'
                  }`}
                >
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {isCurrent
                    ? 'Kezdje meg a munkát az anyaggal találkozást'
                    : 'Rövid leírás a videóról és annak tartalmáról'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-medium">{video.duration}</span>
                <ChevronRight
                  className={`w-5 h-5 transition-colors ${
                    isCurrent ? 'text-teal-500' : 'text-gray-400 group-hover:text-teal-600'
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Series progress indicator */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span className="font-semibold">Sorozat előrehaladása</span>
          <span className="font-semibold">
            {watchedVideos}/{totalVideos} videó megtekintve
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
