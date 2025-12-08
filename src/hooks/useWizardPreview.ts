'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { t } from '@/copy';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { STREAM_TIMEOUT_MESSAGE } from '@/lib/aiPreview';
import { createClientLogger } from '@/lib/clientLogger';
import { WIZARD_CONFIG } from '@/constants/wizard';
import type { ProjectDetails } from '@/lib/projectDetails';
import {
  formatProjectDetailsForPrompt,
  projectDetailFields,
  emptyProjectDetails,
} from '@/lib/projectDetails';

const MAX_PREVIEW_TIMEOUT_RETRIES = WIZARD_CONFIG.MAX_PREVIEW_RETRIES;
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
  userId?: string;
};

export function useWizardPreview({
  form,
  isQuotaExhausted,
  quotaLoading,
  userId,
}: UseWizardPreviewOptions) {
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(userId && { userId }), component: 'useWizardPreview' }),
    [userId],
  );

  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
  const [previewLocked, setPreviewLocked] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);

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
    if (previewLocked) {
      return;
    }

    const hasTitle = form.title.trim().length > 0;
    const hasDescription = projectDetailsText.trim().length > 0;
    if (!hasTitle || !hasDescription) {
      setPreviewLoading(false);
      return;
    }

    type AttemptResult =
      | { status: 'success' }
      | { status: 'timeout'; message: string }
      | { status: 'error'; message: string }
      | { status: 'aborted' };

    const runAttempt = async (): Promise<AttemptResult> => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
        previewAbortRef.current = null;
      }

      const nextRequestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = nextRequestId;

      const controller = new AbortController();
      previewAbortRef.current = controller;

      try {
        const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
          (acc, key) => {
            acc[key] = form.projectDetails[key].trim();
            return acc;
          },
          { ...emptyProjectDetails },
        );

        const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
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
          }),
          signal: controller.signal,
          authErrorMessage: t('errors.preview.authError'),
          errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
          defaultErrorMessage: t('errors.preview.fetchUnknown'),
        });

        if (!resp.body) {
          const message = t('errors.preview.noData');
          if (previewRequestIdRef.current === nextRequestId) {
            setPreviewHtml('<p>(nincs előnézet)</p>');
            setPreviewLocked(false);
          }
          return { status: 'error', message };
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let latestHtml = '';
        let streamErrorMessage: string | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            const rawEvent = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            if (!rawEvent || !rawEvent.startsWith('data:')) continue;
            const jsonPart = rawEvent.replace(/^data:\s*/, '');
            if (!jsonPart) continue;

            try {
              const payload = JSON.parse(jsonPart) as {
                type?: string;
                html?: string;
                message?: string;
              };
              if (payload.type === 'delta' || payload.type === 'done') {
                if (typeof payload.html === 'string') {
                  latestHtml = payload.html;
                  if (previewRequestIdRef.current === nextRequestId) {
                    setPreviewHtml(payload.html || '<p>(nincs előnézet)</p>');
                    if (payload.type === 'done') {
                      setPreviewLocked(true);
                    }
                  }
                }
              } else if (payload.type === 'error') {
                streamErrorMessage =
                  typeof payload.message === 'string' && payload.message.trim().length > 0
                    ? payload.message
                    : t('errors.preview.streamUnknown');
                break;
              }
            } catch (err: unknown) {
              logger.error('Nem sikerült feldolgozni az AI előnézet adatát', err, { jsonPart });
            }
          }

          if (streamErrorMessage) {
            try {
              await reader.cancel();
            } catch {
              /* ignore reader cancel errors */
            }
            break;
          }
        }

        if (streamErrorMessage) {
          if (previewRequestIdRef.current === nextRequestId) {
            setPreviewHtml('<p>(nincs előnézet)</p>');
            setPreviewLocked(false);
          }
          if (streamErrorMessage === STREAM_TIMEOUT_MESSAGE) {
            return { status: 'timeout', message: streamErrorMessage };
          }
          return { status: 'error', message: streamErrorMessage };
        }

        if (!latestHtml && previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
        }

        return { status: 'success' };
      } catch (error) {
        if (isAbortError(error)) {
          return { status: 'aborted' };
        }
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t('errors.preview.fetchUnknown');
        logger.error(t('api.preview.error'), error, { message });
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
          setPreviewLocked(false);
        }
        return { status: 'error', message };
      } finally {
        if (previewAbortRef.current === controller) {
          previewAbortRef.current = null;
        }
      }
    };

    setPreviewLoading(true);

    try {
      for (let attempt = 0; attempt <= MAX_PREVIEW_TIMEOUT_RETRIES; attempt += 1) {
        const result = await runAttempt();
        if (result.status === 'success') {
          return;
        }
        if (result.status === 'aborted') {
          return;
        }
        if (result.status === 'timeout') {
          if (attempt < MAX_PREVIEW_TIMEOUT_RETRIES) {
            const retryIndex = attempt + 1;
            const totalAttempts = MAX_PREVIEW_TIMEOUT_RETRIES + 1;
            showToast({
              title: t('toasts.preview.retrying.title'),
              description: `${result.message} ${t('toasts.preview.retrying.description', {
                current: retryIndex,
                total: totalAttempts,
              })}`,
              variant: 'warning',
            });
            continue;
          }
          const finalMessage = `${result.message} ${t('toasts.preview.finalFailureSuffix')}`;
          showToast({
            title: t('toasts.preview.error.title'),
            description: finalMessage,
            variant: 'error',
          });
          return;
        }
        if (result.status === 'error') {
          if (result.message) {
            showToast({
              title: t('toasts.preview.error.title'),
              description: result.message,
              variant: 'error',
            });
          }
          return;
        }
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [
    form.brandVoice,
    form.deadline,
    form.formality,
    form.projectDetails,
    form.language,
    form.style,
    form.title,
    previewLocked,
    projectDetailsText,
    showToast,
    logger,
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
  }, [callPreview, hasPreviewInputs, isQuotaExhausted, previewLocked, quotaLoading, showToast]);

  const resetPreview = useCallback(() => {
    setPreviewLocked(false);
    setPreviewLoading(false);
    setPreviewHtml(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
      previewAbortRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
      }
    };
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
