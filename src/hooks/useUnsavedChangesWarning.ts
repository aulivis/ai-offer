'use client';

import { useEffect, useRef } from 'react';

type UseUnsavedChangesWarningOptions = {
  hasUnsavedChanges: boolean;
  message?: string;
  enabled?: boolean;
};

/**
 * Hook to warn users before leaving the page with unsaved changes
 * Uses browser's beforeunload event for browser navigation only
 * Does NOT block Next.js router navigation (Link components, router.push, etc.)
 */
export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  message = 'Mentetlen változások vannak. Biztosan el szeretnél navigálni?',
  enabled = true,
}: UseUnsavedChangesWarningOptions) {
  const messageRef = useRef(message);

  // Update message ref when it changes
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    // Handle browser navigation (back/forward, closing tab, etc.)
    // This does NOT block Next.js router navigation (Link, router.push, etc.)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but we still need to set returnValue
      e.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges]);
}
