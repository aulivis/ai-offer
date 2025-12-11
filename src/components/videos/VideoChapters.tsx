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
      <div className="bg-bg-muted rounded-2xl border-2 border-border overflow-hidden">
        <div className="bg-bg px-6 py-4 border-b border-border">
          <h2 className="font-bold text-fg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Videó tartalma</span>
          </h2>
        </div>

        <div className="divide-y divide-border">
          {chapters.map((chapter, index) => (
            <button
              key={index}
              onClick={() => {
                seekToTime(chapter.time);
                setActiveChapter(index);
              }}
              className={`w-full flex items-center gap-4 p-4 hover:bg-primary/10 transition-colors group text-left ${
                activeChapter === index ? 'bg-primary/10 border-l-4 border-primary' : ''
              }`}
            >
              <div className="flex-shrink-0 w-24 h-16 bg-border rounded-lg overflow-hidden relative">
                {chapter.thumbnail ? (
                  <Image
                    src={chapter.thumbnail}
                    alt={chapter.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-ink" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      activeChapter === index ? 'text-primary' : 'text-fg-muted'
                    }`}
                  >
                    {chapter.timeFormatted}
                  </span>
                  <h3
                    className={`font-semibold group-hover:text-primary transition-colors ${
                      activeChapter === index ? 'text-primary' : 'text-fg'
                    }`}
                  >
                    {chapter.title}
                  </h3>
                </div>
                <p className="text-sm text-fg-muted">{chapter.description}</p>
              </div>
              <Play
                className={`w-5 h-5 transition-opacity ${
                  activeChapter === index
                    ? 'text-primary opacity-100'
                    : 'text-fg-muted opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
