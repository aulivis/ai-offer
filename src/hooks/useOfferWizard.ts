'use client';

import { useCallback, useMemo, useState } from 'react';
import { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';

type Step = 1 | 2 | 3;

type ValidationResult = Partial<Record<Step, string[]>>;

function buildValidation({
  title,
  description,
  pricingRows,
}: {
  title: string;
  description: string;
  pricingRows: PriceRow[];
}): ValidationResult {
  const result: ValidationResult = {};

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    result[1] = [...(result[1] ?? []), 'Adj meg egy címet az ajánlathoz.'];
  }

  if (!trimmedDescription) {
    result[1] = [...(result[1] ?? []), 'Írj rövid leírást a projektről.'];
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
  const [description, setDescription] = useState('');
  const [pricingRows, setPricingRows] = useState<PriceRow[]>(initialRows);
  const [attemptedSteps, setAttemptedSteps] = useState<Record<Step, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const validation = useMemo(
    () => buildValidation({ title, description, pricingRows }),
    [title, description, pricingRows],
  );

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
    description,
    setDescription,
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
