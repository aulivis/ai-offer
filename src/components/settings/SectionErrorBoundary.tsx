'use client';

import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { t } from '@/copy';

type SectionErrorBoundaryProps = {
  children: ReactNode;
  sectionName: string;
  onRetry?: () => void;
};

/**
 * Error boundary specifically for settings sections with section-specific fallback UI
 */
export function SectionErrorBoundary({
  children,
  sectionName,
  onRetry,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="w-full p-6">
          <div className="text-center">
            <h3 className="mb-2 text-base font-semibold text-fg">
              {t('errors.settings.sectionError.title', { section: sectionName })}
            </h3>
            <p className="mb-4 text-sm text-fg-muted">
              {t('errors.settings.sectionError.description')}
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="secondary" size="sm">
                {t('errors.settings.sectionError.retry')}
              </Button>
            )}
          </div>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
