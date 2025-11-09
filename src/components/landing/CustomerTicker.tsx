'use client';

import { useEffect, useState } from 'react';
import { t } from '@/copy';

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
  'Innovate Media',
  'Smart Solutions',
  'Creative Minds',
  'Digital Wave',
  'Brand Studio',
  'Tech Innovators',
  'Marketing Hub',
  'Design Lab',
  'Creative Force',
  'Digital Dynamics',
  'Brand Builders',
  'Tech Ventures',
  'Marketing Masters',
  'Design Co.',
  'Creative Partners',
  'Digital Edge',
  'Brand Factory',
  'Tech Group',
  'Marketing Plus',
  'Design House',
  'Creative Works',
  'Digital First',
  'Brand Studio Pro',
  'Tech Labs',
  'Marketing Solutions',
  'Design Bureau',
  'Creative Collective',
  'Digital Minds',
  'Brand Agency',
  'Tech Systems',
  'Marketing Experts',
  'Design Studio Plus',
  'Creative Studio',
  'Digital Experts',
  'Brand Consultants',
  'Tech Innovations',
  'Marketing Agency',
  'Design Works',
  'Creative Team',
  'Digital Solutions',
  'Brand Masters',
  'Tech Partners',
  'Marketing Lab',
];

export default function CustomerTicker({ className = '' }: CustomerTickerProps) {
  const [count, setCount] = useState(500);
  const [isVisible, setIsVisible] = useState(false);
  const [displayedNames, setDisplayedNames] = useState<string[]>([]);

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

    // Randomly select 3 names to display
    const shuffled = [...customerNames].sort(() => Math.random() - 0.5);
    setDisplayedNames(shuffled.slice(0, 3));

    // Rotate names every 8 seconds
    const nameRotationInterval = setInterval(() => {
      const shuffled = [...customerNames].sort(() => Math.random() - 0.5);
      setDisplayedNames(shuffled.slice(0, 3));
    }, 8000);

    return () => {
      clearInterval(interval);
      clearInterval(nameRotationInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-4 text-sm text-fg-muted ${className}`}
    >
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
          <strong className="text-primary">{count}+</strong>{' '}
          {t('landing.customerTicker.activeUsers')}
        </span>
      </div>
      <span className="hidden text-fg-muted sm:inline">•</span>
      <div className="flex items-center gap-2">
        <span className="text-fg-muted">{t('landing.customerTicker.joinedRecently')}</span>
        <div className="flex items-center gap-1">
          {displayedNames.map((name, i) => (
            <span key={`${name}-${i}`} className="font-medium text-fg">
              {name}
              {i < displayedNames.length - 1 && <span className="text-fg-muted">,</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
