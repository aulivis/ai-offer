'use client';

import { useEffect, useCallback } from 'react';
import type { WizardStep } from '@/types/wizard';

type UseWizardKeyboardShortcutsProps = {
  step: WizardStep;
  onNext: () => void;
  onPrev: () => void;
  onSubmit?: () => void;
  isNextDisabled?: boolean;
  isSubmitDisabled?: boolean;
  enabled?: boolean;
};

/**
 * Hook for handling keyboard shortcuts in the wizard
 * - Ctrl/Cmd + Enter: Proceed to next step or submit
 * - Esc: Go back to previous step
 * - Arrow Left: Previous step
 * - Arrow Right: Next step
 */
export function useWizardKeyboardShortcuts({
  step,
  onNext,
  onPrev,
  onSubmit,
  isNextDisabled = false,
  isSubmitDisabled = false,
  enabled = true,
}: UseWizardKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') !== null;

      if (isInputElement) {
        // Allow Ctrl/Cmd + Enter even in inputs for quick submission
        const isModifierEnter =
          (event.ctrlKey || event.metaKey) && event.key === 'Enter';
        if (!isModifierEnter) {
          return;
        }
      }

      // Ctrl/Cmd + Enter: Next step or submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (step === 3 && onSubmit && !isSubmitDisabled) {
          onSubmit();
        } else if (step < 3 && !isNextDisabled) {
          onNext();
        }
        return;
      }

      // Esc: Go back (only if not on first step)
      if (event.key === 'Escape' && step > 1) {
        event.preventDefault();
        onPrev();
        return;
      }

      // Arrow Left: Previous step
      if (event.key === 'ArrowLeft' && !isInputElement && step > 1) {
        event.preventDefault();
        onPrev();
        return;
      }

      // Arrow Right: Next step
      if (event.key === 'ArrowRight' && !isInputElement && step < 3 && !isNextDisabled) {
        event.preventDefault();
        onNext();
        return;
      }
    },
    [enabled, step, onNext, onPrev, onSubmit, isNextDisabled, isSubmitDisabled],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
