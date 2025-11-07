'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';
import type { PreviewIssue } from '@/types/preview';
import { useToast } from '@/components/ToastProvider';

export type OfferPreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

const DEFAULT_PREVIEW_HTML = `<p>${t('offers.wizard.preview.idle')}</p>`;

const PREVIEW_DEBOUNCE_MS = 600;

function coerceSummaryHighlights(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 6);
}

function coercePreviewIssues(value: unknown): PreviewIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const severity = (item as { severity?: unknown }).severity;
      const message = (item as { message?: unknown }).message;

      if (
        (severity === 'info' || severity === 'warning' || severity === 'error') &&
        typeof message === 'string'
      ) {
        const trimmed = message.trim();
        if (trimmed.length > 0) {
          return { severity, message: trimmed } as PreviewIssue;
        }
      }

      return null;
    })
    .filter((item): item is PreviewIssue => item !== null);
}

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

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const callPreview = useCallback(async () => {
    const trimmedTitle = title.trim();
    const normalizedDetails = Object.fromEntries(
      Object.entries(projectDetails).map(([key, value]) => [key, value.trim()]),
    ) as typeof projectDetails;
    const trimmedDetails = projectDetailsText.trim();

    if (!trimmedTitle || !trimmedDetails) {
      if (abortRef.current) {
        requestIdRef.current += 1;
        const controller = abortRef.current;
        abortRef.current = null;
        controller.abort();
      }
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setStatus('idle');
      setError(null);
      setSummary([]);
      setIssues([]);
      return;
    }

    if (abortRef.current) {
      requestIdRef.current += 1;
      const activeController = abortRef.current;
      abortRef.current = null;
      activeController.abort();
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setStatus('loading');
    setError(null);
    setSummary([]);
    setIssues([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: 'Egyedi projekt',
          title: trimmedTitle,
          projectDetails: normalizedDetails,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
        }),
        signal: controller.signal,
        authErrorMessage: t('errors.offer.saveAuth'),
        errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
        defaultErrorMessage: t('errors.preview.fetchUnknown'),
      });

      if (!resp.body) {
        const message = t('errors.preview.noData');
        if (requestIdRef.current === nextRequestId) {
          setStatus('error');
          setError(message);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
          setSummary([]);
          setIssues([{ severity: 'error', message }]);
        }
        showToast({
          title: t('toasts.preview.error.title'),
          description: message,
          variant: 'error',
        });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let latestHtml = '';
      let hasDelta = false;
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
              summary?: unknown;
              issues?: unknown;
            };
            if (payload.type === 'delta' || payload.type === 'done') {
              if (!hasDelta && requestIdRef.current === nextRequestId) {
                setStatus('streaming');
              }
              hasDelta = true;
              if (typeof payload.html === 'string' && requestIdRef.current === nextRequestId) {
                latestHtml = payload.html;
                setPreviewHtml(payload.html || DEFAULT_PREVIEW_HTML);
              }
              if (payload.type === 'done' && requestIdRef.current === nextRequestId) {
                const summaryData = coerceSummaryHighlights(payload.summary);
                const parsedIssues = coercePreviewIssues(payload.issues);
                setSummary(summaryData);
                setIssues(parsedIssues);
              }
            } else if (payload.type === 'error') {
              streamErrorMessage =
                typeof payload.message === 'string'
                  ? payload.message
                  : t('errors.preview.streamUnknown');
              break;
            }
          } catch (err) {
            console.error('Nem sikerült feldolgozni az AI előnézet adatát', err, jsonPart);
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
        if (requestIdRef.current === nextRequestId) {
          setStatus('error');
          setError(streamErrorMessage);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
          setSummary([]);
          setIssues([{ severity: 'error', message: streamErrorMessage }]);
        }
        showToast({
          title: t('toasts.preview.error.title'),
          description: streamErrorMessage,
          variant: 'error',
        });
        return;
      }

      if (!latestHtml && requestIdRef.current === nextRequestId) {
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
      }

      if (requestIdRef.current === nextRequestId) {
        setStatus('success');
        setError(null);
      }
    } catch (error) {
      if (isAbortError(error)) {
        if (requestIdRef.current === nextRequestId) {
          setStatus('aborted');
          setError(t('errors.preview.aborted'));
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
          setSummary([]);
          setIssues([{ severity: 'warning', message: t('errors.preview.aborted') }]);
        }
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t('errors.preview.fetchUnknown');
      if (requestIdRef.current === nextRequestId) {
        setStatus('error');
        setError(message);
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
        setSummary([]);
        setIssues([{ severity: 'error', message }]);
      }
      showToast({
        title: t('toasts.preview.error.title'),
        description: message,
        variant: 'error',
      });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
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
    const controller = abortRef.current;
    if (!controller) {
      return;
    }
    abortRef.current = null;
    requestIdRef.current += 1;
    controller.abort();
    setStatus('aborted');
    setError(t('errors.preview.aborted'));
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setSummary([]);
    setIssues([{ severity: 'warning', message: t('errors.preview.aborted') }]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setStatus('idle');
      setError(null);
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setSummary([]);
      setIssues([]);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmedTitle = title.trim();
    const trimmedDetails = projectDetailsText.trim();
    const shouldGeneratePreview = trimmedTitle.length > 0 && trimmedDetails.length > 0;

    if (shouldGeneratePreview) {
      setStatus('loading');
      setError(null);
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setSummary([]);
      setIssues([]);
    }

    debounceRef.current = window.setTimeout(() => {
      void callPreview();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, title, projectDetailsText, callPreview, debounceMs]);

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
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
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







