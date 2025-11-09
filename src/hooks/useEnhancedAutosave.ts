'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseEnhancedAutosaveOptions<T> {
  /** Data to save */
  data: T;
  /** Storage key */
  key: string;
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Enable autosave (default: true) */
  enabled?: boolean;
  /** Custom save function (default: localStorage) */
  saveFn?: (key: string, data: T) => Promise<void> | void;
  /** Custom load function (default: localStorage) */
  loadFn?: (key: string) => Promise<T | null> | T | null;
  /** Callback when save succeeds */
  onSaveSuccess?: (data: T) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
  /** Enable periodic saves (default: false) */
  enablePeriodicSave?: boolean;
  /** Periodic save interval in milliseconds (default: 30000) */
  periodicSaveInterval?: number;
  /** Save on visibility change (default: true) */
  saveOnVisibilityChange?: boolean;
  /** Save on beforeunload (default: true) */
  saveOnBeforeUnload?: boolean;
}

/**
 * Enhanced autosave hook with error handling, retry logic, and status tracking
 */
export function useEnhancedAutosave<T>(options: UseEnhancedAutosaveOptions<T>) {
  const {
    data,
    key,
    debounceMs = 2000,
    enabled = true,
    saveFn,
    loadFn,
    onSaveSuccess,
    onSaveError,
    enablePeriodicSave = false,
    periodicSaveInterval = 30000,
    saveOnVisibilityChange = true,
    saveOnBeforeUnload = true,
  } = options;

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const periodicSaveRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Default save function (localStorage)
  const defaultSaveFn = useCallback((storageKey: string, dataToSave: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (err) {
      throw new Error('Failed to save to localStorage', { cause: err });
    }
  }, []);

  // Default load function (localStorage)
  const defaultLoadFn = useCallback((storageKey: string): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const save = useCallback(
    async (dataToSave: T, isRetry = false): Promise<boolean> => {
      if (!enabled || isSavingRef.current) {
        return false;
      }

      // Skip if data hasn't changed
      const dataString = JSON.stringify(dataToSave);
      if (dataString === lastSavedDataRef.current && !isRetry) {
        return true;
      }

      isSavingRef.current = true;
      setStatus('saving');
      setError(null);

      try {
        const saveFunction = saveFn || defaultSaveFn;
        await saveFunction(key, dataToSave);

        lastSavedDataRef.current = dataString;
        setStatus('saved');
        setLastSaved(new Date());
        retryCountRef.current = 0;
        setRetryCount(0);
        onSaveSuccess?.(dataToSave);

        // Reset to idle after 2 seconds (use functional update to avoid stale closure)
        setTimeout(() => {
          setStatus((currentStatus) => {
            if (currentStatus === 'saved') {
              return 'idle';
            }
            return currentStatus;
          });
        }, 2000);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error during save');
        setError(error);
        setStatus('error');
        onSaveError?.(error);

        // Retry logic with exponential backoff
        const currentRetryCount = retryCountRef.current;
        if (currentRetryCount < MAX_RETRIES) {
          retryCountRef.current = currentRetryCount + 1;
          setRetryCount(currentRetryCount + 1);
          const backoffDelay = 1000 * Math.pow(2, currentRetryCount); // Exponential backoff: 1s, 2s, 4s
          setTimeout(() => {
            save(dataToSave, true);
          }, backoffDelay);
        } else {
          // Max retries reached, reset after delay
          retryCountRef.current = 0;
          setTimeout(() => {
            setStatus('idle');
            setRetryCount(0);
          }, 5000);
        }

        return false;
      } finally {
        isSavingRef.current = false;
      }
    },
    [enabled, key, saveFn, defaultSaveFn, onSaveSuccess, onSaveError],
  );

  // Debounced save
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(data, false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  // Periodic save
  useEffect(() => {
    if (!enabled || !enablePeriodicSave) return;

    periodicSaveRef.current = setInterval(() => {
      save(data, false);
    }, periodicSaveInterval);

    return () => {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
      }
    };
  }, [enabled, enablePeriodicSave, periodicSaveInterval, data, save]);

  // Save on visibility change
  useEffect(() => {
    if (!enabled || !saveOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save immediately when tab becomes hidden
        save(data, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, saveOnVisibilityChange, data, save]);

  // Save on beforeunload
  useEffect(() => {
    if (!enabled || !saveOnBeforeUnload) return;

    const handleBeforeUnload = () => {
      // Save immediately on page unload
      // Note: async operations may not complete, so we use synchronous save
      try {
        const saveFunction = saveFn || defaultSaveFn;
        saveFunction(key, data);
      } catch (err) {
        console.warn('Failed to save on beforeunload:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveOnBeforeUnload, key, data, saveFn, defaultSaveFn]);

  // Load function (synchronous for localStorage, async for custom load functions)
  const load = useCallback(async (): Promise<T | null> => {
    try {
      const loadFunction = loadFn || defaultLoadFn;
      const result = loadFunction(key);
      // Handle both sync and async results
      const resolvedResult = result instanceof Promise ? await result : result;
      if (resolvedResult) {
        lastSavedDataRef.current = JSON.stringify(resolvedResult);
      }
      return resolvedResult;
    } catch (err) {
      console.warn('Failed to load:', err);
      return null;
    }
  }, [key, loadFn, defaultLoadFn]);

  // Clear function
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedDataRef.current = null;
      setLastSaved(null);
      setStatus('idle');
      setError(null);
    } catch (err) {
      console.warn('Failed to clear:', err);
    }
  }, [key]);

  // Manual save function
  const manualSave = useCallback(async () => {
    return save(data, false);
  }, [data, save]);

  return {
    status,
    lastSaved,
    error,
    retryCount,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    hasError: status === 'error',
    load,
    clear,
    save: manualSave,
  };
}
