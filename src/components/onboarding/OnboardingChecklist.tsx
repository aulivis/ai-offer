'use client';

import { useMemo } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useOnboarding } from './OnboardingProvider';
import Link from 'next/link';

export type ChecklistItem = {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
};

export type OnboardingChecklistProps = {
  title: string;
  items: ChecklistItem[];
  onItemClick?: (itemId: string) => void;
};

export function OnboardingChecklist({ title, items, onItemClick }: OnboardingChecklistProps) {
  const { hasCompletedStep } = useOnboarding();

  const itemsWithStatus = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        completed: item.completed || hasCompletedStep(item.id),
      })),
    [items, hasCompletedStep],
  );

  const completedCount = itemsWithStatus.filter((item) => item.completed).length;
  const totalCount = itemsWithStatus.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (itemsWithStatus.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-fg">{title}</h3>
          <span className="text-sm font-medium text-fg-muted">
            {completedCount} of {totalCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
            aria-label={`${Math.round(progress)}% complete`}
          />
        </div>
      </CardHeader>
      <CardBody>
        <ul className="space-y-3">
          {itemsWithStatus.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {item.completed ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" aria-hidden="true" />
                ) : (
                  <svg
                    className="h-5 w-5 text-fg-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-medium ${
                      item.completed ? 'text-fg-muted line-through' : 'text-fg'
                    }`}
                  >
                    {item.label}
                  </span>
                  {!item.completed && item.action && (
                    <Link
                      href={item.action.href}
                      onClick={() => onItemClick?.(item.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-transparent text-fg hover:bg-bg-muted hover:scale-105 active:scale-95 px-4 py-2.5 text-sm min-h-[44px]"
                    >
                      {item.action.label}
                    </Link>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-xs text-fg-muted">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
