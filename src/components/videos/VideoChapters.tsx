'use client';

import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
import Image from 'next/image';

interface Chapter {
  time: number;
  timeFormatted: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface VideoChaptersProps {
  chapters: Chapter[];
}

export function VideoChapters({ chapters }: VideoChaptersProps) {
  const [activeChapter, setActiveChapter] = useState(0);

  const seekToTime = (time: number) => {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = time;
      videoElement.play();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            <span>Videó tartalma</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {chapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => {
                seekToTime(chapter.time);
                setActiveChapter(index);
              }}
              className={`w-full flex items-center gap-4 p-4 hover:bg-teal-50 transition-colors group text-left ${
                activeChapter === index ? 'bg-teal-50 border-l-4 border-teal-500' : ''
              }`}
            >
              <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded-lg overflow-hidden relative">
                {chapter.thumbnail ? (
                  <Image
                    src={chapter.thumbnail}
                    alt={chapter.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      activeChapter === index ? 'text-teal-600' : 'text-gray-500'
                    }`}
                  >
                    {chapter.timeFormatted}
                  </span>
                  <h3
                    className={`font-semibold group-hover:text-teal-600 transition-colors ${
                      activeChapter === index ? 'text-teal-600' : 'text-gray-900'
                    }`}
                  >
                    {chapter.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{chapter.description}</p>
              </div>
              <Play
                className={`w-5 h-5 transition-opacity ${
                  activeChapter === index
                    ? 'text-teal-500 opacity-100'
                    : 'text-gray-400 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
