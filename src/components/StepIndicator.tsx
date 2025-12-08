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
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
        {t('stepIndicator.statuses.missing')}
      </span>
    );
  }

  if (step.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
        {t('stepIndicator.statuses.completed')}
      </span>
    );
  }

  if (step.status === 'current') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
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
    <div className="space-y-6" role="navigation" aria-label="Wizard steps">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold text-slate-800">
            {t('offers.wizard.progressLabel', { current: currentStepNumber, total })}
          </span>
          {currentLabel ? (
            <span className="text-slate-600 normal-case" aria-current="step">
              {currentLabel}
            </span>
          ) : null}
        </div>
        <div className="flex w-full items-center gap-3 lg:w-auto">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 lg:w-64"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={`Progress: ${Math.round(progress)}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-900 transition-all duration-500 ease-out"
              style={{ width: `${Math.round(progress)}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs font-medium text-slate-500" aria-hidden="true">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3" role="list">
        {steps.map((step, index) => {
          const tone = step.tone ?? 'default';
          const clickable = step.status === 'completed' && typeof step.onSelect === 'function';
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';

          const circleClasses = classNames(
            'grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-all duration-200',
            tone === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-600 ring-2 ring-rose-200'
              : isCompleted
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200'
                : isCurrent
                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg ring-4 ring-slate-200 animate-pulse'
                  : 'border-slate-300 bg-white text-slate-400',
          );

          const labelClasses = classNames(
            'text-sm font-medium transition-colors',
            tone === 'error'
              ? 'text-rose-600'
              : isCurrent
                ? 'text-slate-900 font-semibold'
                : isCompleted
                  ? 'text-slate-700'
                  : 'text-slate-500',
          );

          const cardClasses = classNames(
            'group relative flex h-full w-full flex-col items-start gap-4 rounded-2xl border-2 px-4 py-4 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:items-center',
            clickable
              ? 'cursor-pointer border-slate-300 bg-white hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg active:translate-y-0 focus-visible:ring-primary'
              : 'cursor-default',
            !clickable && !isCurrent ? 'opacity-60' : undefined,
            tone === 'error'
              ? 'border-rose-200 bg-rose-50/80 ring-2 ring-rose-100'
              : isCurrent
                ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-200'
                : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/80'
                  : 'border-slate-200 bg-white/50',
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
