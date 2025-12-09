'use client';

import { useCallback, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';
import {
  formatProjectDetailsForPrompt,
  projectDetailFields,
  emptyProjectDetails,
} from '@/lib/projectDetails';

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

type UseWizardPreviewOptions = {
  form: PreviewForm;
  isQuotaExhausted: boolean;
  quotaLoading: boolean;
  userId: string | undefined;
};

export function useWizardPreview({
  form,
  isQuotaExhausted,
  quotaLoading,
  userId: _userId,
}: UseWizardPreviewOptions) {
  const { showToast } = useToast();

  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
  const [previewLocked, setPreviewLocked] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // AI preview feature has been removed - this is now a no-op
  const callPreview = useCallback(async () => {
    // Preview functionality removed
    setPreviewLoading(false);
  }, []);

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
    // Preview functionality removed - no-op
  }, [hasPreviewInputs, isQuotaExhausted, previewLocked, quotaLoading, showToast]);

  const resetPreview = useCallback(() => {
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
