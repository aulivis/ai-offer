'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAbortController } from './useAbortController';
import { useDebounce } from './useDebounce';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { STREAM_TIMEOUT_MESSAGE } from '@/lib/aiPreview';
import { WIZARD_CONFIG } from '@/constants/wizard';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading'; requestId: number }
  | { status: 'success'; html: string }
  | { status: 'error'; message: string };

type UsePreviewGenerationProps = {
  form: {
    industry: string;
    title: string;
    projectDetails: ProjectDetails;
    deadline: string;
    language: 'hu' | 'en';
    brandVoice: 'friendly' | 'formal';
    style: 'compact' | 'detailed';
  };
  isQuotaExhausted: boolean;
  onSuccess?: (html: string) => void;
  onError?: (message: string) => void;
};

/**
 * Hook for managing AI preview generation with debouncing and retry logic
 */
export function usePreviewGeneration({
  form,
  isQuotaExhausted,
  onSuccess,
  onError,
}: UsePreviewGenerationProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewState, setPreviewState] = useState<PreviewState>({ status: 'idle' });
  const [previewLocked, setPreviewLocked] = useState(false);
  const previewRequestIdRef = useRef(0);
  const { getController, abort } = useAbortController();

  // Debounce form inputs for preview generation
  const debouncedTitle = useDebounce(form.title, WIZARD_CONFIG.PREVIEW_DEBOUNCE_MS);
  const debouncedOverview = useDebounce(
    form.projectDetails.overview,
    WIZARD_CONFIG.PREVIEW_DEBOUNCE_MS,
  );

  const hasPreviewInputs = debouncedTitle.trim().length > 0 && debouncedOverview.trim().length > 0;

  const generatePreview = useCallback(async () => {
    if (previewLocked || isQuotaExhausted || !hasPreviewInputs) {
      return;
    }

    type AttemptResult =
      | { status: 'success'; html: string }
      | { status: 'timeout'; message: string }
      | { status: 'error'; message: string }
      | { status: 'aborted' };

    const runAttempt = async (): Promise<AttemptResult> => {
      abort(); // Abort any existing request

      const nextRequestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = nextRequestId;
      const controller = getController();

      setPreviewState({ status: 'loading', requestId: nextRequestId });

      try {
        const normalizedDetails = {
          overview: form.projectDetails.overview.trim(),
          deliverables: form.projectDetails.deliverables.trim(),
          timeline: form.projectDetails.timeline.trim(),
          constraints: form.projectDetails.constraints.trim(),
        };

        const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: form.industry,
            title: form.title,
            projectDetails: normalizedDetails,
            deadline: form.deadline,
            language: form.language,
            brandVoice: form.brandVoice,
            style: form.style,
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
            setPreviewState({ status: 'error', message });
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
                      setPreviewState({ status: 'success', html: payload.html || '' });
                      setPreviewLocked(true);
                      onSuccess?.(payload.html || '');
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
              console.error('Failed to parse preview stream data', err, jsonPart);
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
            setPreviewState({ status: 'error', message: streamErrorMessage });
          }
          if (streamErrorMessage === STREAM_TIMEOUT_MESSAGE) {
            return { status: 'timeout', message: streamErrorMessage };
          }
          return { status: 'error', message: streamErrorMessage };
        }

        if (!latestHtml && previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
        }

        return { status: 'success', html: latestHtml };
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
        console.error('Preview generation error:', message, error);
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
          setPreviewState({ status: 'error', message });
        }
        return { status: 'error', message };
      }
    };

    try {
      for (let attempt = 0; attempt <= WIZARD_CONFIG.MAX_PREVIEW_RETRIES; attempt += 1) {
        const result = await runAttempt();
        if (result.status === 'success') {
          return;
        }
        if (result.status === 'aborted') {
          return;
        }
        if (result.status === 'timeout') {
          if (attempt < WIZARD_CONFIG.MAX_PREVIEW_RETRIES) {
            continue; // Retry
          }
          onError?.(result.message);
          return;
        }
        if (result.status === 'error') {
          onError?.(result.message);
          return;
        }
      }
    } finally {
      if (previewState.status === 'loading') {
        setPreviewState({ status: 'idle' });
      }
    }
  }, [
    previewLocked,
    isQuotaExhausted,
    hasPreviewInputs,
    form,
    abort,
    getController,
    onSuccess,
    onError,
    previewState.status,
  ]);

  // Auto-generate preview when inputs change (debounced)
  useEffect(() => {
    if (hasPreviewInputs && !previewLocked && !isQuotaExhausted) {
      const timer = setTimeout(() => {
        void generatePreview();
      }, WIZARD_CONFIG.PREVIEW_DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }
  }, [debouncedTitle, debouncedOverview, hasPreviewInputs, previewLocked, isQuotaExhausted, generatePreview]);

  const reset = useCallback(() => {
    abort();
    setPreviewHtml('');
    setPreviewLocked(false);
    setPreviewState({ status: 'idle' });
    previewRequestIdRef.current = 0;
  }, [abort]);

  return {
    previewHtml,
    previewState,
    previewLocked,
    isLoading: previewState.status === 'loading',
    generatePreview,
    reset,
    setPreviewHtml,
    setPreviewLocked,
  };
}














