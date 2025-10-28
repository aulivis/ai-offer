'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  type ProjectDetails,
} from '@/lib/projectDetails';

type Step = 1 | 2 | 3;

type ValidationResult = Partial<Record<Step, string[]>>;

function buildValidation({
  title,
  projectDetails,
  pricingRows,
}: {
  title: string;
  projectDetails: ProjectDetails;
  pricingRows: PriceRow[];
}): ValidationResult {
  const result: ValidationResult = {};

  const trimmedTitle = title.trim();
  const trimmedOverview = projectDetails.overview.trim();

  if (!trimmedTitle) {
    result[1] = [...(result[1] ?? []), 'Adj meg egy címet az ajánlathoz.'];
  }

  if (!trimmedOverview) {
    result[1] = [...(result[1] ?? []), 'Adj rövid projektáttekintést az AI-nak.'];
  }

  const hasPricingRow = pricingRows.some((row) => row.name.trim().length > 0);

  if (!hasPricingRow) {
    result[2] = ['Adj hozzá legalább egy tételt az árlistához.'];
  }

  return result;
}

export function useOfferWizard(initialRows: PriceRow[] = [createPriceRow()]) {
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>(emptyProjectDetails);
  const [pricingRows, setPricingRows] = useState<PriceRow[]>(initialRows);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<Step, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const validation = useMemo(
    () => buildValidation({ title, projectDetails, pricingRows }),
    [title, projectDetails, pricingRows],
  );

  const projectDetailsText = useMemo(() => {
    const normalized = projectDetailFields.reduce<ProjectDetails>((acc, key) => {
      acc[key] = projectDetails[key].trim();
      return acc;
    }, { ...emptyProjectDetails });

    return formatProjectDetailsForPrompt(normalized);
  }, [projectDetails]);

  const isStepValid = useCallback(
    (target: Step) => (validation[target]?.length ?? 0) === 0,
    [validation],
  );

  const goNext = useCallback(() => {
    const errors = validation[step] ?? [];

    if (errors.length > 0) {
      setAttemptedSteps((prev) => ({ ...prev, [step]: true }));
      return false;
    }

    setAttemptedSteps((prev) => ({ ...prev, [step]: false }));
    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
    return true;
  }, [step, validation]);

  const goPrev = useCallback(() => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  }, []);

  const goToStep = useCallback(
    (target: Step) => {
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

  const inlineErrors = attemptedSteps[step] ? (validation[step] ?? []) : [];
  const isNextDisabled = attemptedSteps[step] && !isStepValid(step);

  const updatePricingRows = useCallback((rows: PriceRow[]) => {
    setPricingRows(rows);
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
    inlineErrors,
    isNextDisabled,
    attemptedSteps,
    validation,
    isCurrentStepValid: isStepValid(step),
    isStepValid,
  } as const;
}
