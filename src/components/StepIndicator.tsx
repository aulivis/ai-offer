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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold text-slate-800">
            {t('offers.wizard.progressLabel', { current: currentStepNumber, total })}
          </span>
          {currentLabel ? <span className="text-slate-600 normal-case">{currentLabel}</span> : null}
        </div>
        <div className="flex w-full items-center gap-3 lg:w-auto">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200 lg:w-64"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-500"
              style={{ width: `${Math.round(progress)}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{Math.round(progress)}%</span>
        </div>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3" role="list">
        {steps.map((step, index) => {
          const tone = step.tone ?? 'default';
          const clickable = step.status === 'completed' && typeof step.onSelect === 'function';

          const circleClasses = classNames(
            'grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border text-xs font-semibold transition duration-200',
            tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : step.status === 'completed'
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                : step.status === 'current'
                  ? 'border-slate-900/20 bg-slate-900/10 text-slate-900 shadow-sm'
                  : 'border-border/70 bg-white text-slate-500',
          );

          const labelClasses = classNames(
            'text-sm font-medium transition-colors',
            tone === 'error'
              ? 'text-rose-600'
              : step.status === 'current'
                ? 'text-slate-900'
                : step.status === 'completed'
                  ? 'text-slate-700'
                  : 'text-slate-500',
          );

          const cardClasses = classNames(
            'group flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-border/60 bg-white/95 px-4 py-4 text-left shadow-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:items-center sm:gap-4',
            clickable ? 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg' : 'cursor-default',
            tone === 'error'
              ? 'border-rose-200 bg-rose-50/80'
              : step.status === 'current'
                ? 'border-slate-900/30 bg-slate-900/5 shadow-md ring-1 ring-slate-900/10'
                : step.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/80'
                  : undefined,
          );

          const indicatorContent: ReactNode = (() => {
            if (tone === 'error' && step.status !== 'completed') {
              return <ExclamationIcon className="h-5 w-5" />;
            }

            if (step.status === 'completed') {
              return <CheckIcon className="h-4 w-4" />;
            }

            return index + 1;
          })();

          return (
            <li key={index} className="h-full">
              <button
                type="button"
                onClick={clickable ? step.onSelect : undefined}
                tabIndex={clickable ? 0 : -1}
                aria-disabled={!clickable}
                aria-current={step.status === 'current' ? 'step' : undefined}
                className={cardClasses}
              >
                <span className={circleClasses}>{indicatorContent}</span>
                <span className="flex flex-col items-start gap-1">
                  <span className={labelClasses}>{step.label}</span>
                  {renderBadge(step)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
