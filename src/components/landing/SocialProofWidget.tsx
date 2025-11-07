'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Activity {
  name: string;
  action: string;
  time: string;
}

interface SocialProofWidgetProps {
  activities?: Activity[];
  className?: string;
}

const defaultActivities: Activity[] = [
  { name: 'Kovács Márta', action: 'létrehozott egy új ajánlatot', time: '2 perce' },
  { name: 'Nagy Péter', action: 'elfogadott egy ajánlatot', time: '5 perce' },
  { name: 'Szabó Anna', action: 'megosztott egy ajánlatot', time: '12 perce' },
  { name: 'Tóth János', action: 'létrehozott egy új ajánlatot', time: '18 perce' },
  { name: 'Kiss Éva', action: 'elfogadott egy ajánlatot', time: '25 perce' },
];

export default function SocialProofWidget({
  activities = defaultActivities,
  className = '',
}: SocialProofWidgetProps) {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (!isVisible) return null;

  const activity = activities[currentActivity];

  return (
    <Card
      className={`flex items-center gap-3 border-primary/20 bg-primary/5 p-4 shadow-sm transition-all duration-500 ${className}`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-fg">
          <span className="font-semibold">{activity.name}</span> {activity.action}
        </p>
        <p className="text-xs text-fg-muted">{activity.time}</p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 rounded-full p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
        aria-label="Bezárás"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Card>
  );
}





