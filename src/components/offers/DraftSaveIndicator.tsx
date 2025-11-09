'use client';

import { useEffect, useState } from 'react';
import { t } from '@/copy';
import type { AutosaveStatus } from '@/hooks/useEnhancedAutosave';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type DraftSaveIndicatorProps = {
  status?: AutosaveStatus;
  isSaving?: boolean; // Legacy support
  lastSaved?: Date | null;
  error?: Error | null;
  retryCount?: number;
  onRetry?: () => void;
};

/**
 * Enhanced draft save indicator with error handling and retry support
 * Shows a draft save indicator to inform users their work is being saved
 */
export function DraftSaveIndicator({
  status: statusProp,
  isSaving: isSavingProp,
  lastSaved,
  error,
  retryCount = 0,
  onRetry,
}: DraftSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);
  const [showError, setShowError] = useState(false);

  // Support both new status prop and legacy isSaving prop
  const status = statusProp || (isSavingProp ? 'saving' : 'idle');
  const isSaving = status === 'saving';
  const hasError = status === 'error';

  useEffect(() => {
    if (lastSaved && !isSaving && !hasError) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving, hasError]);

  useEffect(() => {
    if (hasError && error) {
      setShowError(true);
      // Show error for longer if retry count is high
      const timer = setTimeout(() => setShowError(false), retryCount > 2 ? 10000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [hasError, error, retryCount]);

  // Don't show if idle and no saved state to show
  if (status === 'idle' && !showSaved && !showError) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-lg border border-border bg-bg px-3 py-2 shadow-lg transition-all duration-200"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {isSaving ? (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-medium text-fg">{t('wizard.draft.saving') || 'Mentés...'}</span>
        </div>
      ) : hasError && showError ? (
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" aria-hidden="true" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-fg">
              {t('wizard.draft.saveError') || 'Mentési hiba'}
            </span>
            {retryCount > 0 && (
              <span className="text-xs text-fg-muted">
                {t('wizard.draft.retrying') || `Újrapróbálás... (${retryCount})`}
              </span>
            )}
            {onRetry && retryCount === 0 && (
              <button
                onClick={onRetry}
                className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t('wizard.draft.retry') || 'Újrapróbálás'}
              </button>
            )}
          </div>
        </div>
      ) : showSaved ? (
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span className="text-xs font-medium text-fg">
            {lastSaved
              ? t('wizard.draft.savedWithTime', {
                  time: lastSaved.toLocaleTimeString('hu-HU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }) || `Mentve: ${lastSaved.toLocaleTimeString('hu-HU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : t('wizard.draft.saved') || 'Mentve'}
          </span>
        </div>
      ) : null}
    </div>
  );
}


