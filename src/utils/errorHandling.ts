/**
 * Standardized error handling utilities
 */

import { ApiError } from '@/lib/api';
import { t } from '@/copy';

export type ErrorContext = {
  component?: string;
  action?: string;
  step?: number;
  userId?: string;
  [key: string]: unknown;
};

/**
 * Get user-friendly error message from an error
 */
export function getErrorMessage(error: unknown, context?: ErrorContext): string {
  if (error instanceof ApiError) {
    return error.message || t('errors.unknown');
  }

  if (error instanceof Error) {
    // In development, show full error message
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }
    // In production, show generic message
    return t('errors.unknown');
  }

  return t('errors.unknown');
}

/**
 * Log error for monitoring (can be extended to send to Sentry, etc.)
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error('Error occurred:', {
    error: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { contexts: { custom: context } });
  // }
}

/**
 * Get retry action for an error (if applicable)
 */
export function getRetryAction(
  error: unknown,
  onRetry?: () => void,
): { label: string; action: () => void } | null {
  if (!onRetry) {
    return null;
  }

  // Network errors are retryable
  if (error instanceof ApiError && error.status >= 500) {
    return {
      label: t('errors.retry'),
      action: onRetry,
    };
  }

  // Timeout errors are retryable
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      label: t('errors.retry'),
      action: onRetry,
    };
  }

  return null;
}

/**
 * Handle error with standardized logging and user feedback
 */
export function handleError(
  error: unknown,
  context: ErrorContext,
  showToast: (options: {
    title: string;
    description: string;
    variant: 'error' | 'warning' | 'success' | 'info';
    action?: { label: string; onClick: () => void };
  }) => void,
  onRetry?: () => void,
): void {
  logError(error, context);

  const message = getErrorMessage(error, context);
  const retryAction = getRetryAction(error, onRetry);

  showToast({
    title: t('errors.title'),
    description: message,
    variant: 'error',
    ...(retryAction && { action: retryAction }),
  });
}




