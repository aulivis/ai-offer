'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type OptimisticUpdateOptions<T> = {
  initialValue: T;
  updateFn: (value: T) => Promise<T>;
  onSuccess?: (value: T) => void;
  onError?: (error: Error, previousValue: T) => void;
  rollbackOnError?: boolean;
};

/**
 * Hook for optimistic UI updates
 * Immediately updates the UI, then applies the actual update in the background
 * Rolls back on error if rollbackOnError is true
 */
export function useOptimisticUpdate<T>({
  initialValue,
  updateFn,
  onSuccess,
  onError,
  rollbackOnError = true,
}: OptimisticUpdateOptions<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const previousValueRef = useRef<T>(initialValue);
  const valueRef = useRef<T>(initialValue);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update initial value when it changes externally
  useEffect(() => {
    setValue(initialValue);
    previousValueRef.current = initialValue;
    valueRef.current = initialValue;
  }, [initialValue]);

  // Keep valueRef in sync with value
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const update = useCallback(
    async (optimisticValue: T) => {
      // Cancel any pending update
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Store previous value for rollback (use ref to get current value)
      previousValueRef.current = valueRef.current;

      // Optimistically update UI
      setValue(optimisticValue);
      valueRef.current = optimisticValue;
      setIsUpdating(true);

      try {
        // Perform actual update
        const result = await updateFn(optimisticValue);

        // Check if update was aborted
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        // Update with actual result
        setValue(result);
        valueRef.current = result;
        setIsUpdating(false);
        onSuccess?.(result);
      } catch (error) {
        // Check if update was aborted
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        setIsUpdating(false);

        if (rollbackOnError) {
          // Rollback to previous value
          setValue(previousValueRef.current);
          valueRef.current = previousValueRef.current;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, previousValueRef.current);
      }
    },
    [updateFn, onSuccess, onError, rollbackOnError],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUpdating(false);
      // Rollback to previous value
      setValue(previousValueRef.current);
    }
  }, []);

  return {
    value,
    isUpdating,
    update,
    cancel,
  };
}
