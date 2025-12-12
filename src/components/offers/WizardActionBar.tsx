'use client';

import { memo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import type { WizardStep } from '@/types/wizard';

type WizardActionBarProps = {
  step: WizardStep;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
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
  onCancel,
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
  // Only focus if not submitting to avoid interfering with form submission
  useEffect(() => {
    if (step > 1 && nextButtonRef.current && !_isSubmitting) {
      // Small delay to ensure DOM is updated
      const timeout = setTimeout(() => {
        nextButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [step, _isSubmitting]);

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
        <div className="flex gap-2 w-full sm:w-auto">
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={_isSubmitting}
              variant="secondary"
              className="flex-1 sm:flex-none rounded-full border-2 border-danger/30 px-4 py-3 text-sm font-bold text-danger transition-all duration-200 hover:border-danger/50 hover:bg-danger/10 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 touch-manipulation min-h-[44px]"
              aria-label="Cancel and clear draft"
            >
              Mégse
            </Button>
          )}
          <Button
            ref={prevButtonRef}
            onClick={onPrev}
            disabled={step === 1}
            variant="secondary"
            className={`${onCancel ? 'flex-1 sm:flex-none' : 'w-full'} rounded-full border-2 border-border/70 px-5 py-3 text-sm font-bold transition-all duration-200 hover:border-primary/50 hover:text-fg hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-fg-muted disabled:scale-100 touch-manipulation min-h-[44px] sm:w-auto`}
            aria-label={`Go back to previous step${step > 1 ? ` (Step ${step - 1})` : ''}`}
          >
            ← Vissza
          </Button>
        </div>

        {step < 3 ? (
          <Button
            ref={nextButtonRef}
            onClick={onNext}
            disabled={isNextDisabled || isDisabled}
            className="w-full rounded-full bg-fg px-6 py-3 text-sm font-bold text-primary-ink shadow-md transition-all duration-200 hover:bg-fg/90 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-fg-muted disabled:text-fg-muted disabled:scale-100 touch-manipulation min-h-[44px] sm:w-auto"
            aria-label={`Continue to next step${step < 3 ? ` (Step ${step + 1})` : ''}`}
          >
            Folytatás →
            <span className="ml-2 hidden text-xs opacity-70 sm:inline">(Ctrl+Enter)</span>
          </Button>
        ) : (
          _onSubmit && (
            <Button
              ref={nextButtonRef}
              onClick={_onSubmit}
              disabled={_isSubmitDisabled || isDisabled}
              loading={_isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-primary to-turquoise-600 px-8 py-4 text-base font-bold text-primary-ink shadow-lg transition-all hover:from-primary/90 hover:to-turquoise-700 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation min-h-[52px] sm:w-auto"
              aria-label="Generate offer and save"
            >
              {_isSubmitting ? (
                <>
                  <span className="mr-2">Generálás...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  Ajánlat létrehozása
                  <span className="ml-2 hidden text-xs opacity-80 sm:inline">(Ctrl+Enter)</span>
                </>
              )}
            </Button>
          )
        )}
      </div>
    </div>
  );
});
