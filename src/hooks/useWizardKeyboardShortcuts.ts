'use client';

import { useEffect, useCallback } from 'react';

type KeyboardShortcutHandler = {
  onNext?: () => void;
  onPrev?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
};

/**
 * Hook for wizard keyboard shortcuts
 * - Ctrl/Cmd + Enter: Go to next step
 * - Esc: Go back (if not on first step)
 */
export function useWizardKeyboardShortcuts({
  onNext,
  onPrev,
  onEscape,
  enabled = true,
}: KeyboardShortcutHandler) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Go to next step
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onNext?.();
        return;
      }

      // Esc: Go back or close
      if (event.key === 'Escape') {
        // Don't prevent default if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        onEscape?.() || onPrev?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onNext, onPrev, onEscape]);
}

