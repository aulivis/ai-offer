'use client';

import type { ReactNode, SVGProps } from 'react';
import { Button } from '@/components/ui/Button';

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
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
        Hiányos
      </span>
    );
  }

  if (step.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        Kész
      </span>
    );
  }

  if (step.status === 'current') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Folyamatban
      </span>
    );
  }

  return null;
}

export default function StepIndicator({ steps }: Props) {
  return (
    <ol className="-mx-2 flex w-auto snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-2 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {steps.map((step, index) => {
        const tone = step.tone ?? 'default';
        const clickable = step.status === 'completed' && typeof step.onSelect === 'function';

        const circleClasses = classNames(
          'grid h-10 w-10 place-items-center rounded-full border text-sm font-medium transition',
          tone === 'error'
            ? 'border-rose-300 bg-rose-50 text-rose-600'
            : step.status === 'completed'
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
              : step.status === 'current'
                ? 'border-border bg-white text-slate-900 shadow-sm'
                : 'border-border bg-white text-slate-500',
        );

        const labelClasses = classNames(
          'text-sm transition-colors',
          tone === 'error'
            ? 'font-semibold text-rose-600'
            : step.status === 'current'
              ? 'font-semibold text-slate-900'
              : step.status === 'completed'
                ? 'text-slate-700'
                : 'text-slate-500',
        );

        const indicatorContent: ReactNode = (() => {
          if (tone === 'error' && step.status !== 'completed') {
            return <ExclamationIcon className="h-5 w-5" />;
          }

          if (step.status === 'completed') {
            return <CheckIcon className="h-5 w-5" />;
          }

          return index + 1;
        })();

        return (
          <li key={index} className="flex min-w-[220px] items-center gap-3 snap-start sm:min-w-0">
            <Button
              type="button"
              onClick={clickable ? step.onSelect : undefined}
              disabled={!clickable}
              aria-current={step.status === 'current' ? 'step' : undefined}
              className={classNames(
                'flex items-center gap-3 rounded-2xl border border-transparent bg-white/90 px-3 py-2 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span className={circleClasses}>{indicatorContent}</span>
              <span className="flex flex-col items-start gap-1">
                <span className={labelClasses}>{step.label}</span>
                {renderBadge(step)}
              </span>
            </Button>
            {index < steps.length - 1 && (
              <span className="hidden h-px w-10 rounded bg-slate-200 sm:block" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
