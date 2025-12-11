'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  type ProjectDetailKey,
  type ProjectDetails,
} from '@/lib/projectDetails';
import type { PreviewIssue } from '@/types/preview';
import { t } from '@/copy';
import type { WizardStep } from '@/types/wizard';

type ValidationSteps = Partial<Record<WizardStep, string[]>>;

type StepFieldErrors = {
  title?: string;
  projectDetails: Partial<Record<ProjectDetailKey, string>>;
};

type ValidationFields = {
  1: StepFieldErrors;
  2: { pricing?: string };
  3: Record<string, never>;
};

type ValidationIssue = PreviewIssue & { step: WizardStep };

type ValidationResult = {
  steps: ValidationSteps;
  fields: ValidationFields;
  issues: ValidationIssue[];
};

function buildValidation({
  title,
  projectDetails,
  pricingRows,
}: {
  title: string;
  projectDetails: ProjectDetails;
  pricingRows: PriceRow[];
}): ValidationResult {
  const steps: ValidationSteps = {};
  const fields: ValidationFields = {
    1: { projectDetails: {} },
    2: {},
    3: {},
  };
  const issues: ValidationIssue[] = [];

  const registerError = (step: WizardStep, message: string, assign?: () => void) => {
    steps[step] = [...(steps[step] ?? []), message];
    issues.push({ step, severity: 'error', message });
    assign?.();
  };

  const trimmedTitle = title.trim();
  const trimmedOverview = projectDetails.overview.trim();

  if (!trimmedTitle) {
    registerError(1, t('offers.wizard.validation.titleRequired'), () => {
      fields[1].title = t('offers.wizard.validation.titleRequired');
    });
  }

  if (!trimmedOverview) {
    registerError(1, t('offers.wizard.validation.overviewRequired'), () => {
      fields[1].projectDetails.overview = t('offers.wizard.validation.overviewRequired');
    });
  }

  const hasPricingRow = pricingRows.some((row) => {
    if (!row || typeof row !== 'object') return false;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    return name.length > 0;
  });

  if (!hasPricingRow) {
    registerError(2, t('offers.wizard.validation.pricingRequired'), () => {
      fields[2].pricing = t('offers.wizard.validation.pricingRequired');
    });
  }

  return { steps, fields, issues };
}

/**
 * Custom hook for managing offer wizard state and validation
 *
 * @param initialRows - Initial pricing rows (defaults to one empty row)
 * @returns Wizard state and navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   step,
 *   title,
 *   setTitle,
 *   goNext,
 *   goPrev,
 *   validation
 * } = useOfferWizard();
 * ```
 */
export function useOfferWizard(initialRows: PriceRow[] = [createPriceRow()]) {
  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState('');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(emptyProjectDetails);
  const [pricingRows, setPricingRows] = useState<PriceRow[]>(initialRows);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<WizardStep, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const validation = useMemo(
    () => buildValidation({ title, projectDetails, pricingRows }),
    [title, projectDetails, pricingRows],
  );

  const projectDetailsText = useMemo(() => {
    const normalized = projectDetailFields.reduce<ProjectDetails>(
      (acc, key) => {
        acc[key] = projectDetails[key].trim();
        return acc;
      },
      { ...emptyProjectDetails },
    );

    return formatProjectDetailsForPrompt(normalized);
  }, [projectDetails]);

  const isStepValid = useCallback(
    (target: WizardStep) => (validation.steps[target]?.length ?? 0) === 0,
    [validation.steps],
  );

  const goNext = useCallback(() => {
    const errors = validation.steps[step] ?? [];

    if (errors.length > 0) {
      setAttemptedSteps((prev) => ({ ...prev, [step]: true }));
      return false;
    }

    setAttemptedSteps((prev) => ({ ...prev, [step]: false }));
    setStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev));
    return true;
  }, [step, validation.steps]);

  const goPrev = useCallback(() => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));
  }, []);

  const goToStep = useCallback(
    (target: WizardStep) => {
      if (target >= step) {
        return;
      }

      if (!isStepValid(target)) {
        return;
      }

      setStep(target);
    },
    [isStepValid, step],
  );

  const restoreStep = useCallback((target: WizardStep) => {
    // Allow restoring to any step without validation (for draft restoration)
    if (target >= 1 && target <= 3) {
      setStep(target as WizardStep);
    }
  }, []);

  const isNextDisabled = attemptedSteps[step] && !isStepValid(step);

  const updatePricingRows = useCallback((rows: PriceRow[]) => {
    setPricingRows(rows);
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setTitle('');
    setProjectDetails(emptyProjectDetails);
    setPricingRows([createPriceRow()]);
    setAttemptedSteps({
      1: false,
      2: false,
      3: false,
    });
  }, []);

  return {
    step,
    title,
    setTitle,
    projectDetails,
    setProjectDetails,
    projectDetailsText,
    pricingRows,
    setPricingRows: updatePricingRows,
    goNext,
    goPrev,
    goToStep,
    restoreStep,
    reset,
    isNextDisabled,
    attemptedSteps,
    validation,
    isCurrentStepValid: isStepValid(step),
    isStepValid,
  } as const;
}
