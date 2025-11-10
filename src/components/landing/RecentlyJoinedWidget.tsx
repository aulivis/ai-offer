'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface RecentJoin {
  name: string;
  location?: string;
  time: string;
}

const mockJoins: RecentJoin[] = [
  { name: 'Kovács Márta', location: 'Budapest', time: '2 perce' },
  { name: 'Nagy Péter', location: 'Debrecen', time: '5 perce' },
  { name: 'Szabó Anna', location: 'Szeged', time: '12 perce' },
  { name: 'Tóth János', location: 'Pécs', time: '18 perce' },
  { name: 'Kiss Éva', location: 'Győr', time: '25 perce' },
];

export default function RecentlyJoinedWidget({ className = '' }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockJoins.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const currentJoin = mockJoins[currentIndex];

  return (
    <Card
      className={`flex items-center gap-3 border-primary/20 bg-primary/5 p-3 shadow-sm transition-all duration-500 ${className}`}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs text-fg">
          <span className="font-semibold">{currentJoin.name}</span>
          {currentJoin.location && (
            <>
              {' '}
              <span className="text-fg-muted">({currentJoin.location})</span>
            </>
          )}{' '}
          <span className="text-fg-muted">csatlakozott</span>
        </p>
        <p className="text-[10px] text-fg-muted">{currentJoin.time}</p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 rounded-full p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
        aria-label="Bezárás"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </Card>
  );
}

