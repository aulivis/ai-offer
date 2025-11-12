'use client';

import { useMemo } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CircleIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
                  <CircleIcon className="h-5 w-5 text-fg-muted" aria-hidden="true" />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      onClick={() => onItemClick?.(item.id)}
                    >
                      <Link href={item.action.href}>{item.action.label}</Link>
                    </Button>
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
