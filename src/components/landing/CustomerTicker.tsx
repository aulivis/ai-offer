'use client';

import { useEffect, useState } from 'react';

interface CustomerTickerProps {
  className?: string;
}

const customerNames = [
  'Studio Fluo',
  'Tech Solutions Kft.',
  'Creative Agency',
  'Digital Partners',
  'Design Studio',
  'Marketing Pro',
  'Brand Experts',
  'Growth Agency',
];

export default function CustomerTicker({ className = '' }: CustomerTickerProps) {
  const [count, setCount] = useState(500);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Animate counter
    const target = 500 + Math.floor(Math.random() * 50);
    const duration = 2000;
    const steps = 60;
    const increment = (target - count) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount((prev) => Math.floor(prev + increment));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 text-sm text-fg-muted ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full border-2 border-bg bg-gradient-to-br from-primary to-accent"
            />
          ))}
        </div>
        <span className="font-medium text-fg">
          <strong className="text-primary">{count}+</strong> aktív felhasználó
        </span>
      </div>
      <span className="hidden text-fg-muted sm:inline">•</span>
      <div className="flex items-center gap-2">
        <span className="text-fg-muted">Csatlakoztak mostanában:</span>
        <div className="flex items-center gap-1">
          {customerNames.slice(0, 3).map((name, i) => (
            <span key={i} className="font-medium text-fg">
              {name}
              {i < 2 && <span className="text-fg-muted">,</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

