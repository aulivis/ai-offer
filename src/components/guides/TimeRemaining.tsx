'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeRemainingProps {
  totalMinutes: number;
}

export function TimeRemaining({ totalMinutes }: TimeRemainingProps) {
  const [remainingTime, setRemainingTime] = useState(totalMinutes);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setReadingProgress(Math.min(progress, 100));

      // Calculate remaining time based on progress
      const remaining = Math.max(0, totalMinutes * (1 - progress / 100));
      setRemainingTime(Math.ceil(remaining));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalMinutes]);

  if (readingProgress >= 95) {
    return null; // Hide when almost done
  }

  return (
    <div className="fixed bottom-6 right-6 bg-bg rounded-full shadow-xl px-6 py-3 flex items-center gap-2 border-2 border-border z-40">
      <Clock className="w-5 h-5 text-primary" />
      <span className="text-sm font-semibold text-fg">Még {remainingTime} perc</span>
    </div>
  );
}
