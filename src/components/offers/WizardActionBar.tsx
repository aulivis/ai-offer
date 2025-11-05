'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { t } from '@/copy';

type WizardActionBarProps = {
  step: 1 | 2 | 3;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isNextDisabled: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  stepLabels: Record<1 | 2 | 3, string>;
};

/**
 * Action bar for wizard navigation (Back/Next/Submit buttons)
 * Memoized to prevent unnecessary re-renders
 */
export const WizardActionBar = memo(function WizardActionBar({
  step,
  onPrev,
  onNext,
  onSubmit,
  isNextDisabled,
  isSubmitDisabled,
  isSubmitting,
  stepLabels,
}: WizardActionBarProps) {
  // Simplified button labels - step names shown in indicator
  const nextButtonLabel = t('offers.wizard.actions.next');
  const backButtonLabel = t('offers.wizard.actions.back');
  const submitLabel = isSubmitting
    ? t('offers.wizard.actions.previewInProgress')
    : t('offers.wizard.actions.save');

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 -mx-6 -mb-6 border-t border-border/70 bg-[rgb(var(--color-bg-muted-rgb)/0.98)] px-6 py-4 shadow-[0_-8px_16px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 ease-out sm:static sm:mx-0 sm:mb-0 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={onPrev}
          disabled={step === 1}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
        >
          {backButtonLabel}
        </Button>

        {step < 3 ? (
          <Button
            onClick={onNext}
            disabled={isNextDisabled}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {nextButtonLabel}
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

