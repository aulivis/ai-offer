'use client';

import * as React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export type StepperStep = {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
};

type StepperProps = {
  steps: StepperStep[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/**
 * Standard Stepper component for multi-step processes
 * Provides accessible step navigation and status indication
 *
 * @example
 * ```tsx
 * <Stepper
 *   steps={[
 *     { id: '1', label: 'Details', status: 'completed' },
 *     { id: '2', label: 'Pricing', status: 'current' },
 *     { id: '3', label: 'Review', status: 'upcoming' },
 *   ]}
 * />
 * ```
 */
export function Stepper({ steps, orientation = 'horizontal', className = '' }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      {orientation === 'horizontal' ? (
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
            >
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div
                    className={`h-0.5 w-full ${
                      step.status === 'completed' ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                </div>
              )}
              {/* Step content */}
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-bg">
                {step.status === 'completed' ? (
                  <CheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                ) : step.status === 'error' ? (
                  <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
                ) : step.status === 'current' ? (
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-border" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {step.status === 'completed'
                    ? 'Completed'
                    : step.status === 'current'
                      ? 'Current'
                      : step.status === 'error'
                        ? 'Error'
                        : 'Upcoming'}{' '}
                  {step.label}
                </span>
              </div>
              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'current'
                      ? 'text-primary'
                      : step.status === 'completed'
                        ? 'text-fg'
                        : step.status === 'error'
                          ? 'text-danger'
                          : 'text-fg-muted'
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-1 text-xs text-fg-muted">{step.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol role="list" className="space-y-6">
          {steps.map((step, stepIdx) => (
            <li key={step.id}>
              <div className="flex items-start">
                {/* Step indicator */}
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-bg">
                  {step.status === 'completed' ? (
                    <CheckIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : step.status === 'error' ? (
                    <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
                  ) : step.status === 'current' ? (
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-border" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {step.status === 'completed'
                      ? 'Completed'
                      : step.status === 'current'
                        ? 'Current'
                        : step.status === 'error'
                          ? 'Error'
                          : 'Upcoming'}{' '}
                    {step.label}
                  </span>
                </div>
                {/* Step content */}
                <div className="ml-4 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'current'
                        ? 'text-primary'
                        : step.status === 'completed'
                          ? 'text-fg'
                          : step.status === 'error'
                            ? 'text-danger'
                            : 'text-fg-muted'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-sm text-fg-muted">{step.description}</p>
                  )}
                </div>
              </div>
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div className="ml-4 mt-2 h-6 w-0.5 bg-border" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}



