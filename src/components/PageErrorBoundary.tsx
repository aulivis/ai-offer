'use client';

import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';
import type { ErrorBoundaryProps } from './ErrorBoundary';

/**
 * Error boundary wrapper specifically for page components.
 * This ensures that rendering errors in a page don't crash the entire application.
 */
type PageErrorBoundaryProps = Pick<ErrorBoundaryProps, 'onError' | 'fallback' | 'onRetry'> & {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
};

export function PageErrorBoundary({
  children,
  onError = () => {},
  fallback,
  onRetry = () => {},
  maxRetries = 3,
  retryDelay = 100,
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={fallback}
      onRetry={onRetry}
      maxRetries={maxRetries}
      retryDelay={retryDelay}
    >
      {children}
    </ErrorBoundary>
  );
}
