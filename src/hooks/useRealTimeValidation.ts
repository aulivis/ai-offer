'use client';

import { useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useWizardValidation } from './useWizardValidation';
import { WIZARD_CONFIG } from '@/constants/wizard';
import type { ProjectDetails, ProjectDetailKey } from '@/lib/projectDetails';
import type { PriceRow } from '@/components/EditablePriceTable';

type ValidationErrors = {
  title?: string;
  projectDetails: Partial<Record<ProjectDetailKey, string>>;
  pricing?: string;
};

type UseRealTimeValidationProps = {
  step: number;
  title: string;
  projectDetails: ProjectDetails;
  pricingRows: PriceRow[];
  onValidationChange: (errors: ValidationErrors) => void;
};

/**
 * Hook for real-time validation with debouncing
 */
export function useRealTimeValidation({
  step,
  title,
  projectDetails,
  pricingRows,
  onValidationChange,
}: UseRealTimeValidationProps) {
  const { validateStep1, validateStep2 } = useWizardValidation();

  // Debounce inputs to avoid excessive validation
  const debouncedTitle = useDebounce(title, WIZARD_CONFIG.VALIDATION_DEBOUNCE_MS);
  const debouncedOverview = useDebounce(
    projectDetails.overview,
    WIZARD_CONFIG.VALIDATION_DEBOUNCE_MS,
  );

  // Validate step 1 fields
  const step1Errors = useMemo(() => {
    if (step !== 1) {
      return { projectDetails: {} };
    }
    return validateStep1(debouncedTitle, {
      ...projectDetails,
      overview: debouncedOverview,
    });
  }, [step, debouncedTitle, debouncedOverview, projectDetails, validateStep1]);

  // Validate step 2 fields
  const step2Errors = useMemo(() => {
    if (step !== 2) {
      return { projectDetails: {} };
    }
    return validateStep2(pricingRows);
  }, [step, pricingRows, validateStep2]);

  // Combine errors based on current step
  const combinedErrors = useMemo<ValidationErrors>(() => {
    if (step === 1) {
      return step1Errors;
    }
    if (step === 2) {
      return step2Errors;
    }
    return { projectDetails: {} };
  }, [step, step1Errors, step2Errors]);

  // Update validation errors when they change
  useEffect(() => {
    onValidationChange(combinedErrors);
  }, [combinedErrors, onValidationChange]);

  return {
    errors: combinedErrors,
    isValid: !combinedErrors.title && !combinedErrors.pricing && 
             !Object.keys(combinedErrors.projectDetails).length,
  };
}

