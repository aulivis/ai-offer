'use client';

import { useEffect, useState } from 'react';

type DraftSaveIndicatorProps = {
  isSaving?: boolean;
  lastSaved?: Date | null;
};

/**
 * Shows a draft save indicator to inform users their work is being saved
 */
export function DraftSaveIndicator({ isSaving, lastSaved }: DraftSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving]);

  if (!isSaving && !showSaved) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg transition-opacity"
      role="status"
      aria-live="polite"
    >
      {isSaving ? (
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent text-slate-600" />
          <span className="text-xs font-medium text-slate-700">Mentés...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">✓</span>
          <span className="text-xs font-medium text-slate-700">
            Vázlat mentve{' '}
            {lastSaved &&
              `(${lastSaved.toLocaleTimeString('hu-HU', {
                hour: '2-digit',
                minute: '2-digit',
              })})`}
          </span>
        </div>
      )}
    </div>
  );
}

