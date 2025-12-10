'use client';

import { t } from '@/copy';
import { memo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { WizardStep } from '@/types/wizard';

type WizardActionBarProps = {
  step: WizardStep;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isNextDisabled: boolean;
  isSubmitDisabled?: boolean;
  isSubmitting: boolean;
  isQuotaExhausted?: boolean;
  isQuotaLoading?: boolean;
};

/**
 * Enhanced action bar for wizard navigation with improved mobile behavior
 * Memoized to prevent unnecessary re-renders
 */
export const WizardActionBar = memo(function WizardActionBar({
  step,
  onPrev,
  onNext,
  onSubmit: _onSubmit,
  isNextDisabled,
  isSubmitDisabled: _isSubmitDisabled = false,
  isSubmitting: _isSubmitting,
  isQuotaExhausted = false,
  isQuotaLoading = false,
}: WizardActionBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: focus next button when step changes
  useEffect(() => {
    if (step > 1 && nextButtonRef.current) {
      // Small delay to ensure DOM is updated
      const timeout = setTimeout(() => {
        nextButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  const nextButtonLabel = t('offers.wizard.actions.next');
  const backButtonLabel = t('offers.wizard.actions.back');

  const isDisabled = isQuotaExhausted || isQuotaLoading;

  return (
    <div
      ref={containerRef}
      className="sticky bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-white/98 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-300 ease-out sm:static sm:mx-0 sm:mb-0 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none"
      role="navigation"
      aria-label="Wizard navigation"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          ref={prevButtonRef}
          onClick={onPrev}
          disabled={step === 1}
          variant="secondary"
          className="w-full rounded-full border border-border/70 px-5 py-3 text-sm font-semibold transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300 touch-manipulation min-h-[44px] sm:w-auto"
          aria-label={`Go back to previous step${step > 1 ? ` (Step ${step - 1})` : ''}`}
        >
          ← {backButtonLabel}
        </Button>

        {step < 3 ? (
          <Button
            ref={nextButtonRef}
            onClick={onNext}
            disabled={isNextDisabled || isDisabled}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200 touch-manipulation min-h-[44px] sm:w-auto"
            aria-label={`Continue to next step${step < 3 ? ` (Step ${step + 1})` : ''}`}
          >
            {nextButtonLabel} →
            <span className="ml-2 hidden text-xs opacity-70 sm:inline">(Ctrl+Enter)</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
});
