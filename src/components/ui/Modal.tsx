'use client';

import { t } from '@/copy';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type ModalProps = {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** ID of element that labels the modal */
  labelledBy?: string;
  /** ID of element that describes the modal */
  describedBy?: string;
  /** Modal content */
  children: ReactNode;
  /** Additional className for the modal panel */
  className?: string;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Prevent body scroll when open (default: true) */
  preventBodyScroll?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

/**
 * Modal component with focus trap, keyboard navigation, and accessibility support
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
 *   <ModalHeader>
 *     <h2>Modal Title</h2>
 *   </ModalHeader>
 *   <ModalBody>
 *     Modal content
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button onClick={() => setIsOpen(false)}>Close</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  className = '',
  showCloseButton = true,
  preventBodyScroll = true,
  size = 'md',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const getFocusableElements = () => {
      const elements = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      return elements ? Array.from(elements).filter((el) => !el.hasAttribute('disabled')) : [];
    };

    const focusFirstElement = () => {
      const [firstFocusable] = getFocusableElements();
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        panelRef.current?.focus();
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
        panelRef.current?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first || !panelRef.current?.contains(current)) {
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
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  // Determine max width based on size prop or className
  const hasCustomMaxWidth = className?.includes('max-w-');
  const sizeMaxWidth = hasCustomMaxWidth ? '' : sizeClasses[size];

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-fg/20 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onClick={(e) => {
        // Close on overlay click (mobile-friendly)
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative w-full ${sizeMaxWidth} max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl md:rounded-3xl border border-border bg-bg p-4 sm:p-5 md:p-6 shadow-pop focus:outline-none transition-transform duration-300 ease-out ${className || ''}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: open && !prefersReducedMotion ? 'slideUp 300ms ease-out' : undefined,
        }}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('modal.close') || 'Close'}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <div className={showCloseButton ? 'pr-10' : ''}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Modal header component
 */
export function ModalHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-4 flex items-center justify-between border-b border-border pb-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Modal body component
 */
export function ModalBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex-1 overflow-y-auto ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Modal footer component
 */
export function ModalFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 flex items-center justify-end gap-2 border-t border-border pt-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
