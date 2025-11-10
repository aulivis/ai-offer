'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Hook for field-level validation with debounced feedback
 */
export function useFieldValidation<T>(
  value: T,
  validator: (val: T) => string | undefined,
  debounceMs = 500,
) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!touched) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const err = validator(value);
      setError(err);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, touched, validator, debounceMs]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    const err = validator(value);
    setError(err);
  }, [value, validator]);

  const reset = useCallback(() => {
    setTouched(false);
    setError(undefined);
  }, []);

  return {
    error,
    touched,
    setTouched,
    onBlur: handleBlur,
    reset,
  };
}