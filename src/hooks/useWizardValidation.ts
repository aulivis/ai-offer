'use client';

import { useMemo, useCallback } from 'react';
import { t } from '@/copy';
import type { ProjectDetails, ProjectDetailKey } from '@/lib/projectDetails';
import type { PriceRow } from '@/components/EditablePriceTable';
import type { WizardStep } from '@/types/wizard';

type ValidationErrors = {
  title?: string;
  projectDetails: Partial<Record<ProjectDetailKey, string>>;
  pricing?: string;
};

type ValidationResult = {
  errors: ValidationErrors;
  isValid: boolean;
  stepErrors: Partial<Record<WizardStep, string[]>>;
};

/**
 * Hook for validating wizard form data with real-time feedback
 */
export function useWizardValidation() {
  const validateStep1 = useCallback(
    (title: string, projectDetails: ProjectDetails): ValidationErrors => {
      const errors: ValidationErrors = {
        projectDetails: {},
      };

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        errors.title = t('offers.wizard.validation.titleRequired');
      }

      const trimmedOverview = projectDetails.overview.trim();
      if (!trimmedOverview) {
        errors.projectDetails.overview = t('offers.wizard.validation.overviewRequired');
      }

      return errors;
    },
    [],
  );

  const validateStep2 = useCallback((rows: PriceRow[]): ValidationErrors => {
    const errors: ValidationErrors = {
      projectDetails: {},
    };

    const hasPricingRow = rows.some((row) => row.name.trim().length > 0);
    if (!hasPricingRow) {
      errors.pricing = t('offers.wizard.validation.pricingRequired');
    }

    return errors;
  }, []);

  const validateAll = useCallback(
    (title: string, projectDetails: ProjectDetails, pricingRows: PriceRow[]): ValidationResult => {
      const step1Errors = validateStep1(title, projectDetails);
      const step2Errors = validateStep2(pricingRows);

      const stepErrors: Partial<Record<WizardStep, string[]>> = {};

      if (step1Errors.title) {
        stepErrors[1] = [...(stepErrors[1] || []), step1Errors.title];
      }
      if (step1Errors.projectDetails.overview) {
        stepErrors[1] = [...(stepErrors[1] || []), step1Errors.projectDetails.overview];
      }
      if (step2Errors.pricing) {
        stepErrors[2] = [...(stepErrors[2] || []), step2Errors.pricing];
      }

      const isValid = Object.keys(stepErrors).length === 0;

      return {
        errors: {
          ...step1Errors,
          ...step2Errors,
        },
        isValid,
        stepErrors,
      };
    },
    [validateStep1, validateStep2],
  );

  return {
    validateStep1,
    validateStep2,
    validateAll,
  };
}
