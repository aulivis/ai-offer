'use client';

import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

/**
 * Error boundary wrapper specifically for page components.
 * This ensures that rendering errors in a page don't crash the entire application.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
