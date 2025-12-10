'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '@/copy';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

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
  children: React.ReactNode;
  /** Additional className for the modal panel */
  className?: string;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

/**
 * Standard Modal component using Radix UI Dialog
 * Provides accessible modal functionality with focus trap and keyboard navigation
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
  size = 'md',
}: ModalProps) {
  const hasCustomMaxWidth = className?.includes('max-w-');
  const sizeMaxWidth = hasCustomMaxWidth ? '' : sizeClasses[size];
  const reducedMotion = useReducedMotion();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
              >
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-fg/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              </motion.div>
              <DialogPrimitive.Content
                asChild
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
              >
                <motion.div
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          scale: 0.95,
                          y: -20,
                        }
                  }
                  animate={
                    reducedMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }
                  }
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          scale: 0.95,
                          y: -20,
                        }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }
                  }
                  className={`fixed left-[50%] top-[50%] z-50 grid w-full ${sizeMaxWidth} translate-x-[-50%] translate-y-[-50%] gap-3 sm:gap-4 border border-border bg-bg p-4 sm:p-5 md:p-6 lg:p-8 shadow-pop rounded-xl sm:rounded-2xl md:rounded-3xl max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-y-auto mx-4 sm:mx-0 ${className}`}
                >
                  {showCloseButton && (
                    <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation">
                      <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                      <span className="sr-only">{t('modal.close') || 'Close'}</span>
                    </DialogPrimitive.Close>
                  )}
                  <div className={showCloseButton ? 'pr-10 sm:pr-12' : ''}>{children}</div>
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
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

export { Dialog, DialogTrigger, DialogClose };
