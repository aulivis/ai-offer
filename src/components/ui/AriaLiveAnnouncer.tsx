'use client';

import { useEffect, useRef } from 'react';

/**
 * AriaLiveAnnouncer - Provides accessible announcements for dynamic content changes
 *
 * Use this component to announce important updates to screen readers.
 * Announcements are automatically cleared after a short delay to prevent
 * screen reader clutter.
 */
export function AriaLiveAnnouncer() {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear announcements after they've been read (prevents screen reader clutter)
    const clearAnnouncements = () => {
      if (politeRef.current) {
        setTimeout(() => {
          if (politeRef.current) {
            politeRef.current.textContent = '';
          }
        }, 1000);
      }
      if (assertiveRef.current) {
        setTimeout(() => {
          if (assertiveRef.current) {
            assertiveRef.current.textContent = '';
          }
        }, 1000);
      }
    };

    // Listen for custom announcement events
    const handlePoliteAnnouncement = (e: CustomEvent<string>) => {
      if (politeRef.current) {
        politeRef.current.textContent = e.detail;
        clearAnnouncements();
      }
    };

    const handleAssertiveAnnouncement = (e: CustomEvent<string>) => {
      if (assertiveRef.current) {
        assertiveRef.current.textContent = e.detail;
        clearAnnouncements();
      }
    };

    window.addEventListener('aria-live-polite', handlePoliteAnnouncement as EventListener);
    window.addEventListener('aria-live-assertive', handleAssertiveAnnouncement as EventListener);

    return () => {
      window.removeEventListener('aria-live-polite', handlePoliteAnnouncement as EventListener);
      window.removeEventListener(
        'aria-live-assertive',
        handleAssertiveAnnouncement as EventListener,
      );
    };
  }, []);

  return (
    <>
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </>
  );
}

/**
 * Utility function to announce messages to screen readers
 *
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive' for urgent messages
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
) {
  const event = new CustomEvent(`aria-live-${priority}`, { detail: message });
  window.dispatchEvent(event);
}

