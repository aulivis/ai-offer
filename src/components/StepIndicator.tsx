'use client';

import { t } from '@/copy';
import type { ReactNode, SVGProps } from 'react';

export type StepIndicatorStatus = 'completed' | 'current' | 'upcoming';
export type StepIndicatorTone = 'default' | 'error';

export type StepIndicatorStep = {
  label: string;
  status: StepIndicatorStatus;
  tone?: StepIndicatorTone;
  onSelect?: () => void;
};

type Props = {
  steps: StepIndicatorStep[];
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 10.5 8.5 14 15 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExclamationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 5v6" strokeLinecap="round" />
      <path d="M10 14.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function renderBadge(step: StepIndicatorStep): ReactNode {
  const tone = step.tone ?? 'default';

  if (tone === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-danger">
        {t('stepIndicator.statuses.missing')}
      </span>
    );
  }

  if (step.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
        {t('stepIndicator.statuses.completed')}
      </span>
    );
  }

  if (step.status === 'current') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
        {t('stepIndicator.statuses.current')}
      </span>
    );
  }

  return null;
}

export default function StepIndicator({ steps }: Props) {
  const total = steps.length;
  const currentIndex = steps.findIndex((step) => step.status === 'current');
  const allCompleted = steps.every((step) => step.status === 'completed');
  const activeIndex = currentIndex >= 0 ? currentIndex : Math.max(0, total - 1);
  const progress = allCompleted
    ? 100
    : total <= 0
      ? 0
      : ((activeIndex + 1) / Math.max(total, 1)) * 100;

  const currentLabel = steps[currentIndex]?.label ?? steps[activeIndex]?.label ?? '';
  const currentStepNumber = Math.min(activeIndex + 1, total);

  return (
    <div className="space-y-6 mb-8" role="navigation" aria-label="Wizard steps">
      {/* Enhanced progress header */}
      <div className="bg-gradient-to-br from-primary/10 via-turquoise-50 to-primary/5 rounded-2xl p-6 border-2 border-primary/20 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2 text-sm font-bold shadow-md">
              {t('offers.wizard.progressLabel', { current: currentStepNumber, total })}
            </span>
            {currentLabel ? (
              <span className="text-lg font-bold text-fg normal-case" aria-current="step">
                {currentLabel}
              </span>
            ) : null}
          </div>
          <div className="flex w-full items-center gap-4 lg:w-auto">
            <div
              className="h-4 w-full overflow-hidden rounded-full bg-border/50 shadow-inner lg:w-72"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={`Progress: ${Math.round(progress)}%`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-turquoise-500 to-primary transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${Math.round(progress)}%` }}
                aria-hidden="true"
              />
            </div>
            <span
              className="text-lg font-bold text-primary min-w-[3rem] text-right"
              aria-hidden="true"
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3" role="list">
        {steps.map((step, index) => {
          const tone = step.tone ?? 'default';
          const clickable = step.status === 'completed' && typeof step.onSelect === 'function';
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';

          const circleClasses = classNames(
            'grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-200',
            tone === 'error'
              ? 'border-danger bg-danger text-white shadow-lg ring-4 ring-danger/30'
              : isCompleted
                ? 'border-success bg-success text-white shadow-xl ring-4 ring-success/30'
                : isCurrent
                  ? 'border-primary bg-primary text-white shadow-2xl ring-4 ring-primary/40 scale-110 animate-pulse'
                  : 'border-border/50 bg-bg-muted text-fg-muted',
          );

          const labelClasses = classNames(
            'text-sm font-medium transition-colors',
            tone === 'error'
              ? 'text-danger'
              : isCurrent
                ? 'text-fg font-semibold'
                : isCompleted
                  ? 'text-fg'
                  : 'text-fg-muted',
          );

          const cardClasses = classNames(
            'group relative flex h-full w-full flex-col items-start gap-4 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center',
            clickable
              ? 'cursor-pointer border-slate-300 bg-white hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg active:translate-y-0 focus-visible:ring-primary'
              : 'cursor-default',
            !clickable && !isCurrent ? 'opacity-60' : undefined,
            tone === 'error'
              ? 'border-danger/20 bg-danger/10 ring-2 ring-danger/10'
              : isCurrent
                ? 'border-fg bg-bg-muted shadow-md ring-2 ring-fg/20'
                : isCompleted
                  ? 'border-success/20 bg-success/10'
                  : 'border-border bg-bg-muted/50',
          );

          const indicatorContent: ReactNode = (() => {
            if (tone === 'error' && !isCompleted) {
              return <ExclamationIcon className="h-5 w-5" aria-hidden="true" />;
            }

            if (isCompleted) {
              return <CheckIcon className="h-5 w-5" aria-hidden="true" />;
            }

            return <span aria-hidden="true">{index + 1}</span>;
          })();

          const stepDescription = (() => {
            if (tone === 'error') {
              return 'This step has errors that need to be fixed';
            }
            if (isCompleted) {
              return `Step ${index + 1} completed: ${step.label}`;
            }
            if (isCurrent) {
              return `Current step ${index + 1}: ${step.label}`;
            }
            return `Upcoming step ${index + 1}: ${step.label}`;
          })();

          return (
            <li key={index} className="h-full">
              <button
                type="button"
                {...(clickable && step.onSelect && { onClick: step.onSelect })}
                tabIndex={clickable || isCurrent ? 0 : -1}
                aria-disabled={!clickable && !isCurrent}
                {...(isCurrent && { 'aria-current': 'step' })}
                aria-label={stepDescription}
                {...(tone === 'error' && { 'aria-describedby': `step-${index}-error` })}
                className={cardClasses}
              >
                <span className={circleClasses} aria-hidden="true">
                  {indicatorContent}
                </span>
                <span className="flex flex-col items-start gap-1">
                  <span className={labelClasses}>{step.label}</span>
                  {renderBadge(step)}
                </span>
                {tone === 'error' && (
                  <span id={`step-${index}-error`} className="sr-only">
                    This step contains validation errors
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
