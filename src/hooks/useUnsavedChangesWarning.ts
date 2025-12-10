'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type UseUnsavedChangesWarningOptions = {
  hasUnsavedChanges: boolean;
  message?: string;
  enabled?: boolean;
};

/**
 * Hook to warn users before leaving the page with unsaved changes
 * Uses browser's beforeunload event and Next.js router events
 */
export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  message = 'Mentetlen változások vannak. Biztosan el szeretnél navigálni?',
  enabled = true,
}: UseUnsavedChangesWarningOptions) {
  const router = useRouter();
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but we still need to set returnValue
      e.returnValue = messageRef.current;
      return messageRef.current;
    };

    // Note: Next.js App Router doesn't have a direct router event system
    // We'll need to intercept navigation attempts differently
    // For now, we rely on beforeunload for browser navigation
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges, router]);
}
