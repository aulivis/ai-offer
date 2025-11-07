'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing AbortController instances
 * Automatically aborts previous controller when creating a new one
 * Cleans up on unmount
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getController = useCallback(() => {
    // Abort previous controller if it exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    // Create new controller
    controllerRef.current = new AbortController();
    return controllerRef.current;
  }, []);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { getController, abort, current: controllerRef.current };
}





