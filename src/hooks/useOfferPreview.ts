'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';
import type { PreviewIssue } from '@/types/preview';
import { useToast } from '@/components/ToastProvider';
import { fetchWithSupabaseAuth, isAbortError, ApiError } from '@/lib/api';

export type OfferPreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

const DEFAULT_PREVIEW_HTML = `<p>${t('offers.wizard.preview.idle')}</p>`;

const PREVIEW_DEBOUNCE_MS = 600;

export function useOfferPreview({
  title,
  projectDetails,
  projectDetailsText,
  enabled,
  debounceMs = PREVIEW_DEBOUNCE_MS,
}: {
  title: string;
  projectDetails: ProjectDetails;
  projectDetailsText: string;
  enabled: boolean;
  debounceMs?: number;
}) {
  const { showToast } = useToast();
  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_HTML);
  const [status, setStatus] = useState<OfferPreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const [issues, setIssues] = useState<PreviewIssue[]>([]);

  const debounceRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callPreview = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedDetails = projectDetailsText.trim();

    if (!trimmedTitle || !trimmedDetails) {
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setStatus('idle');
      setError(null);
      setSummary([]);
      setIssues([]);
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const normalizedDetails = Object.fromEntries(
        Object.entries(projectDetails).map(([key, value]) => [key, value.trim()]),
      ) as ProjectDetails;

      const response = await fetchWithSupabaseAuth('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          industry: 'Egyedi projekt',
          projectDetails: normalizedDetails,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
          prices: [],
          previewOnly: true,
          clientId: null,
          imageAssets: [],
          schedule: [],
          testimonials: [],
          guarantees: [],
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
        setStatus('success');
        setError(null);
      } else {
        throw new ApiError(data.error || t('errors.preview.fetchUnknown'));
      }
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        setStatus('aborted');
        return;
      }

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('errors.preview.fetchUnknown');

      setStatus('error');
      setError(errorMessage);
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
  }, [title, projectDetails, projectDetailsText, showToast]);

  const refresh = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void callPreview();
  }, [callPreview]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('aborted');
    setError(null);
    setSummary([]);
    setIssues([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setStatus('idle');
      setError(null);
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setSummary([]);
      setIssues([]);
      return;
    }

    // Debounce the API call
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    debounceRef.current = window.setTimeout(() => {
      void callPreview();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [enabled, title, projectDetailsText, debounceMs, callPreview]);

  // Auto-hide success status after 4 seconds
  useEffect(() => {
    if (status !== 'success') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, 4000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    },
    [],
  );

  return {
    previewHtml,
    status,
    error,
    summary,
    issues,
    refresh,
    abort,
  };
}
