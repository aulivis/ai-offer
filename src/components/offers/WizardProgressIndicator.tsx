'use client';

import { useMemo } from 'react';
import type { WizardStep } from '@/types/wizard';
import { t } from '@/copy';

type WizardProgressIndicatorProps = {
  step: WizardStep;
  completedFields: {
    step1: number;
    step2: number;
    step3: number;
  };
  totalFields: {
    step1: number;
    step2: number;
    step3: number;
  };
};

/**
 * Shows progress percentage and completion status for the wizard
 */
export function WizardProgressIndicator({
  step,
  completedFields,
  totalFields,
}: WizardProgressIndicatorProps) {
  const progress = useMemo(() => {
    let completed = 0;
    let total = 0;

    // Step 1 is always counted
    completed += completedFields.step1;
    total += totalFields.step1;

    // Step 2 only if we're on step 2 or 3
    if (step >= 2) {
      completed += completedFields.step2;
      total += totalFields.step2;
    }

    // Step 3 only if we're on step 3
    if (step >= 3) {
      completed += completedFields.step3;
      total += totalFields.step3;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [step, completedFields, totalFields]);

  const estimatedTime = useMemo(() => {
    // Rough estimates: Step 1: 2min, Step 2: 1min, Step 3: 2min
    const stepTimes = [2, 1, 2];
    let remaining = 0;

    if (step < 3) {
      remaining += stepTimes[2]; // Step 3 always remaining if not on it
    }
    if (step < 2) {
      remaining += stepTimes[1]; // Step 2 remaining if not on it
    }
    // Current step always has some time remaining
    remaining += stepTimes[step - 1] * 0.5;

    return Math.round(remaining);
  }, [step]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Előrehaladás</span>
            <span className="text-sm font-bold text-slate-900">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <span className="block text-xs text-slate-500">Becsült idő</span>
          <span className="text-sm font-semibold text-slate-700">{estimatedTime} perc</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Step {step}/3
        </span>
        {progress === 100 && step === 3 && (
          <span className="ml-auto font-medium text-emerald-600">✓ Kész a generáláshoz</span>
        )}
      </div>
    </div>
  );
}


