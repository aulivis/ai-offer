'use client';

import { t } from '@/copy';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

type ToastVariant = 'default' | 'error' | 'success' | 'info' | 'warning';

export type ToastOptions = {
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = {
  id: number;
  description: string;
  variant: ToastVariant;
  title?: string;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-border bg-bg text-fg shadow-card',
  success: 'border-success/30 bg-success/10 text-success shadow-card',
  error: 'border-danger/30 bg-danger/10 text-danger shadow-card',
  info: 'border-accent/30 bg-accent/10 text-accent shadow-card',
  warning: 'border-warning/30 bg-warning/10 text-warning shadow-card',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = 'default', duration = 6000 }: ToastOptions) => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      const toast: ToastRecord = {
        id,
        description,
        variant,
        ...(title ? { title } : {}),
      };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 ${VARIANT_STYLES[toast.variant]}`}
            role={toast.variant === 'error' || toast.variant === 'warning' ? 'alert' : 'status'}
            aria-live={
              toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite'
            }
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                <p className="text-sm leading-5">{toast.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeToast(toast.id)}
                className="-mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold text-fg transition hover:bg-[rgb(var(--color-bg-muted-rgb)/1)]"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast csak ToastProvider kontextusában használható.');
  }
  return context;
}
