'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/copy';
import type { ProjectDetails } from '@/lib/projectDetails';
import type { PreviewIssue } from '@/types/preview';
import { useToast } from '@/components/ToastProvider';

export type OfferPreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

const DEFAULT_PREVIEW_HTML = `<p>${t('offers.wizard.preview.idle')}</p>`;

const PREVIEW_DEBOUNCE_MS = 600;

export function useOfferPreview({
  title,
  projectDetails: _projectDetails,
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
  const { showToast: _showToast } = useToast();
  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_HTML);
  const [status, setStatus] = useState<OfferPreviewStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const [issues, setIssues] = useState<PreviewIssue[]>([]);

  const debounceRef = useRef<number | null>(null);

  // AI preview feature has been removed - this is now a no-op
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

    // Preview functionality removed - set to idle state
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setStatus('idle');
    setError(null);
    setSummary([]);
    setIssues([]);
  }, [title, projectDetailsText]);

  const refresh = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void callPreview();
  }, [callPreview]);

  const abort = useCallback(() => {
    // Preview functionality removed - no-op
    setStatus('idle');
    setError(null);
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setSummary([]);
    setIssues([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
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

    // Preview functionality removed - set to idle state
    setStatus('idle');
    setError(null);
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setSummary([]);
    setIssues([]);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, title, projectDetailsText, debounceMs]);

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
