'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  poster?: string;
  title: string;
  duration?: number;
}

export function VideoPlayer({ videoUrl, poster, title: _title, duration: _duration }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [videoDuration, setVideoDuration] = useState('0:00');
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);
        setCurrentTime(formatTime(video.currentTime));
      }
    };

    const updateDuration = () => {
      if (video.duration) {
        setVideoDuration(formatTime(video.duration));
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const percent = parseFloat(e.target.value);
    video.currentTime = (percent / 100) * video.duration;
    setProgress(percent);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  return (
    <div
      className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={poster}
        onClick={togglePlay}
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Custom controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center play button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl min-h-[44px] min-w-[44px]"
              aria-label="Lejátszás"
            >
              <Play className="w-10 h-10 text-teal-600 ml-1" />
            </button>
          </div>
        )}

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`,
              }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-teal-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={isPlaying ? 'Szünet' : 'Lejátszás'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                className="text-white hover:text-teal-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Hangerő"
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <span className="text-white text-sm font-medium">
                {currentTime} / {videoDuration}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Playback speed */}
              <select
                className="bg-white/20 text-white text-sm px-3 py-1 rounded-lg border border-white/30 backdrop-blur-sm min-h-[44px]"
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) {
                    video.playbackRate = parseFloat(e.target.value);
                  }
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              <button
                className="text-white hover:text-teal-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Beállítások"
              >
                <Settings className="w-6 h-6" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-teal-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Teljes képernyő"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
