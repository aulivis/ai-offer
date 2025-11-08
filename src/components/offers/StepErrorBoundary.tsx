'use client';

import { Component, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { t } from '@/copy';

type StepErrorBoundaryProps = {
  children: ReactNode;
  stepNumber: 1 | 2 | 3;
  onRetry?: () => void;
};

/**
 * Error boundary specifically for wizard steps with step-specific fallback UI
 */
export function StepErrorBoundary({ children, stepNumber, onRetry }: StepErrorBoundaryProps) {
  const stepName = t(`offers.wizard.steps.${stepNumber === 1 ? 'details' : stepNumber === 2 ? 'pricing' : 'summary'}`);

  return (
    <ErrorBoundary
      fallback={
        <Card className="w-full max-w-[var(--column-width)] p-8">
          <div className="text-center">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Hiba történt a(z) {stepName} lépésben
            </h2>
            <p className="mb-6 text-sm text-slate-600">
              Sajnáljuk, valami hiba történt. Próbáld újra vagy frissítsd az oldalt.
            </p>
            {onRetry && (
              <Button
                onClick={onRetry}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Újrapróbálás
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














