'use client';

import { useCallback, useMemo, useState, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';
import {
  formatProjectDetailsForPrompt,
  projectDetailFields,
  emptyProjectDetails,
} from '@/lib/projectDetails';
import { fetchWithSupabaseAuth, isAbortError, ApiError } from '@/lib/api';

const DEFAULT_PREVIEW_PLACEHOLDER_HTML =
  '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>';

type PreviewForm = {
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: 'hu' | 'en';
  brandVoice: 'friendly' | 'formal';
  style: 'compact' | 'detailed';
  formality: 'tegeződés' | 'magázódás';
};

type PriceRow = {
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  vat: number;
};

type UseWizardPreviewOptions = {
  form: PreviewForm;
  isQuotaExhausted: boolean;
  quotaLoading: boolean;
  userId: string | undefined;
  rows?: PriceRow[];
  selectedTestimonialsContent?: Array<{ id: string; text: string }>;
  selectedGuaranteeIds?: string[];
  guarantees?: Array<{ id: string; text: string }>;
  scheduleItems?: string[];
  selectedPdfTemplateId?: string | undefined;
  defaultTemplateId?: string;
};

export function useWizardPreview({
  form,
  isQuotaExhausted,
  quotaLoading,
  userId: _userId,
  rows = [],
  selectedTestimonialsContent = [],
  selectedGuaranteeIds = [],
  guarantees = [],
  scheduleItems = [],
  selectedPdfTemplateId,
  defaultTemplateId,
}: UseWizardPreviewOptions) {
  const { showToast } = useToast();

  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
  const [previewLocked, setPreviewLocked] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const projectDetailsText = useMemo(() => {
    const normalized = projectDetailFields.reduce<ProjectDetails>(
      (acc, key) => {
        acc[key] = form.projectDetails[key].trim();
        return acc;
      },
      { ...emptyProjectDetails },
    );
    return formatProjectDetailsForPrompt(normalized);
  }, [form.projectDetails]);

  const hasPreviewInputs = form.title.trim().length > 0 && projectDetailsText.trim().length > 0;

  const callPreview = useCallback(async () => {
    if (previewLocked || previewLoading || isQuotaExhausted || quotaLoading || !hasPreviewInputs) {
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPreviewLoading(true);

    try {
      const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
        (acc, key) => {
          acc[key] = form.projectDetails[key].trim();
          return acc;
        },
        { ...emptyProjectDetails },
      );

      const serializedPrices = rows.map(({ name, qty, unit, unitPrice, vat }) => ({
        name,
        qty,
        unit,
        unitPrice,
        vat,
      }));

      // Get testimonial texts
      const testimonialTexts =
        selectedTestimonialsContent.length > 0
          ? selectedTestimonialsContent.map((t) => t.text.trim()).filter(Boolean)
          : [];

      // Get guarantee texts
      const guaranteeTexts = selectedGuaranteeIds
        .map((id) => guarantees.find((g) => g.id === id)?.text.trim())
        .filter((text): text is string => Boolean(text && text.length > 0));

      // Resolve template ID
      const resolvedTemplateId = selectedPdfTemplateId || defaultTemplateId || 'default';

      const response = await fetchWithSupabaseAuth('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          projectDetails: normalizedDetails,
          deadline: form.deadline,
          language: form.language,
          brandVoice: form.brandVoice,
          style: form.style,
          formality: form.formality,
          prices: serializedPrices,
          previewOnly: true,
          clientId: null,
          imageAssets: [],
          templateId: resolvedTemplateId,
          testimonials: testimonialTexts,
          schedule: scheduleItems,
          guarantees: guaranteeTexts,
        }),
        signal: controller.signal,
        defaultErrorMessage: t('errors.preview.fetchUnknown'),
        errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
      });

      if (controller.signal.aborted) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData.error === 'string' ? errorData.error : t('errors.preview.fetchUnknown');
        throw new ApiError(errorMessage);
      }

      const data = await response.json();

      if (controller.signal.aborted) {
        return;
      }

      if (data.ok && data.previewHtml) {
        setPreviewHtml(data.previewHtml);
        setPreviewLocked(true);
        setPreviewLoading(false);
      } else {
        throw new ApiError(data.error || t('errors.preview.fetchUnknown'));
      }
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        setPreviewLoading(false);
        return;
      }

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('errors.preview.fetchUnknown');

      setPreviewLoading(false);
      showToast({
        title: t('toasts.preview.error.title'),
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      if (!controller.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  }, [
    form,
    rows,
    selectedTestimonialsContent,
    selectedGuaranteeIds,
    guarantees,
    scheduleItems,
    selectedPdfTemplateId,
    defaultTemplateId,
    previewLocked,
    previewLoading,
    isQuotaExhausted,
    quotaLoading,
    hasPreviewInputs,
    showToast,
  ]);

  const handleGeneratePreview = useCallback(() => {
    if (previewLocked) {
      return;
    }
    if (quotaLoading) {
      showToast({
        title: t('offers.wizard.quota.loading'),
        description: t('offers.wizard.quota.loading'),
        variant: 'info',
      });
      return;
    }
    if (isQuotaExhausted) {
      showToast({
        title: t('offers.wizard.quota.exhaustedToastTitle'),
        description: t('offers.wizard.quota.exhaustedToastDescription'),
        variant: 'warning',
      });
      return;
    }
    if (!hasPreviewInputs) {
      showToast({
        title: t('toasts.preview.missingData.title'),
        description: t('toasts.preview.missingData.description'),
        variant: 'warning',
      });
      return;
    }
    void callPreview();
  }, [hasPreviewInputs, isQuotaExhausted, previewLocked, quotaLoading, showToast, callPreview]);

  const resetPreview = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPreviewLocked(false);
    setPreviewLoading(false);
    setPreviewHtml(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
  }, []);

  return {
    previewHtml,
    previewLocked,
    previewLoading,
    hasPreviewInputs,
    setPreviewHtml,
    setPreviewLocked,
    callPreview,
    handleGeneratePreview,
    resetPreview,
  };
}
