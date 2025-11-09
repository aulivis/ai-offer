'use client';

import { useCallback, useState } from 'react';
import {
  emptyProjectDetails,
  type ProjectDetails,
  type ProjectDetailKey,
} from '@/lib/projectDetails';

export type Step1Form = {
  industry: string;
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: 'hu' | 'en';
  brandVoice: 'friendly' | 'formal';
  style: 'compact' | 'detailed';
};

const DEFAULT_FORM: Step1Form = {
  industry: 'Marketing',
  title: '',
  projectDetails: emptyProjectDetails,
  deadline: '',
  language: 'hu',
  brandVoice: 'friendly',
  style: 'detailed',
};

/**
 * Hook for managing offer form state
 */
export function useOfferForm(initialForm?: Partial<Step1Form>) {
  const [form, setForm] = useState<Step1Form>({
    ...DEFAULT_FORM,
    ...initialForm,
  });

  const updateField = useCallback((field: keyof Step1Form, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateProjectDetails = useCallback((field: ProjectDetailKey, value: string) => {
    setForm((prev) => ({
      ...prev,
      projectDetails: { ...prev.projectDetails, [field]: value },
    }));
  }, []);

  const updateForm = useCallback((updates: Partial<Step1Form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setForm({ ...DEFAULT_FORM, ...initialForm });
  }, [initialForm]);

  return {
    form,
    setForm,
    updateField,
    updateProjectDetails,
    updateForm,
    reset,
  };
}
