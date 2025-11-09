'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Enable swipe-to-close gesture (default: true) */
  enableSwipeToClose?: boolean;
  /** Threshold for swipe-to-close (default: 0.25 = 25% of height) */
  swipeThreshold?: number;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Custom header content */
  header?: ReactNode;
  /** Prevent body scroll when open (default: true) */
  preventBodyScroll?: boolean;
};

/**
 * BottomSheet component for mobile navigation
 *
 * Features:
 * - Slide-up animation from bottom
 * - Swipe-to-close gesture support
 * - Backdrop with blur
 * - Focus trap
 * - Escape key to close
 * - Prevents body scroll when open
 * - Accessible (ARIA attributes, keyboard navigation)
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className = '',
  enableSwipeToClose = true,
  swipeThreshold = 0.25,
  showCloseButton = true,
  header,
  preventBodyScroll = true,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const touchStartYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (!preventBodyScroll || !mounted) return;

    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [open, preventBodyScroll, mounted]);

  // Focus trap
  useEffect(() => {
    if (!open || !mounted) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusableElements = () => {
      const elements = sheetRef.current?.querySelectorAll<HTMLElement>(focusableSelectors);
      return elements ? Array.from(elements).filter((el) => !el.hasAttribute('disabled')) : [];
    };

    const focusFirstElement = () => {
      const [firstFocusable] = getFocusableElements();
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        sheetRef.current?.focus();
      }
    };

    window.setTimeout(focusFirstElement, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        sheetRef.current?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first || !sheetRef.current?.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [open, onClose, mounted]);

  // Swipe-to-close gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeToClose) return;
    // Only start drag from the top area (header/drag handle)
    const target = e.target as HTMLElement;
    const isHeaderArea =
      target.closest('[data-sheet-header]') ||
      target.closest('[data-drag-handle]') ||
      e.touches[0].clientY < 100; // Top 100px of sheet

    if (!isHeaderArea) return;

    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeToClose || !isDraggingRef.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartYRef.current;

    // Only allow downward swipes
    if (deltaY > 0) {
      setDragY(deltaY);
      e.preventDefault(); // Prevent scrolling
    }
  };

  const handleTouchEnd = () => {
    if (!enableSwipeToClose || !isDraggingRef.current) return;

    const sheetHeight = sheetRef.current?.offsetHeight || 0;
    const threshold = sheetHeight * swipeThreshold;

    if (dragY > threshold) {
      // Close the sheet
      onClose();
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    touchStartYRef.current = 0;
  };

  // Reset drag state when sheet closes
  useEffect(() => {
    if (!open) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragY(0);
      touchStartYRef.current = 0;
    }
  }, [open]);

  if (!mounted || !open) {
    return null;
  }

  const translateY = isDragging ? Math.max(0, dragY) : 0;
  const opacity = isDragging ? Math.max(0, 1 - dragY / (sheetRef.current?.offsetHeight || 1)) : 1;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="presentation"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === backdropRef.current) {
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-fg/20 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity }}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={`w-full max-w-lg rounded-t-3xl border-t border-x border-border bg-bg shadow-pop transition-transform duration-300 ease-out ${className}`}
        style={{
          transform: `translateY(${translateY}px)`,
          maxHeight: '90vh',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Drag handle indicator */}
        {enableSwipeToClose && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            data-drag-handle
            aria-hidden="true"
          >
            <div className="h-1 w-12 rounded-full bg-border" />
          </div>
        )}

        {/* Header */}
        {(title || header || showCloseButton) && (
          <div
            className="flex items-center justify-between border-b border-border px-4 py-3"
            data-sheet-header
          >
            {header ? (
              header
            ) : (
              <>
                {title && (
                  <h2 id="bottom-sheet-title" className="text-lg font-semibold text-fg">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto rounded-full p-2 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
