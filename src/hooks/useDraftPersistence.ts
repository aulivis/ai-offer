'use client';

import { useEffect, useCallback } from 'react';

const DRAFT_KEY_PREFIX = 'offer-wizard-draft';

/**
 * Hook for auto-saving wizard state to localStorage
 */
export function useDraftPersistence<T>(key: string, data: T, enabled = true) {
  const storageKey = `${DRAFT_KEY_PREFIX}-${key}`;

  useEffect(() => {
    if (!enabled) return;

    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (err) {
        console.warn('Failed to save draft:', err);
      }
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timeout);
  }, [storageKey, data, enabled]);

  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { loadDraft, clearDraft };
}







