'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';
import { clientLogger } from '@/lib/clientLogger';
import { envClient } from '@/env.client';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  onRetry?: () => void | Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
  errorInfo: { componentStack: string } | null;
};

/**
 * Enhanced error boundary component with retry mechanisms and better error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    clientLogger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack?.substring(0, 500),
      retryCount: this.state.retryCount,
    });
    this.setState({ errorInfo });

    // Report to Sentry (if Sentry is configured)
    // Use validated env helper
    if (envClient.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: true,
            retryCount: this.state.retryCount,
          },
        });
      } catch (sentryError) {
        // Sentry not available, skip reporting
        const errorData =
          sentryError instanceof Error
            ? {
                error: {
                  name: sentryError.name,
                  message: sentryError.message,
                  stack: process.env.NODE_ENV === 'production' ? undefined : sentryError.stack,
                },
              }
            : sentryError !== undefined
              ? { error: String(sentryError) }
              : undefined;
        clientLogger.warn('Sentry not available', errorData);
      }
    }

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = async () => {
    this.setState({ isRetrying: true });

    try {
      // Call custom retry handler if provided
      if (this.props.onRetry) {
        await this.props.onRetry();
      }

      // Reset error state after a short delay to allow state to settle
      const delay = this.props.retryDelay || 100;
      this.retryTimeoutId = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          retryCount: this.state.retryCount + 1,
          isRetrying: false,
          errorInfo: null,
        });
      }, delay);
    } catch (error) {
      clientLogger.error('ErrorBoundary retry failed', error, {
        retryCount: this.state.retryCount,
      });
      this.setState({ isRetrying: false });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries ?? 3;
      const canRetry = this.state.retryCount < maxRetries;
      const isRetrying = this.state.isRetrying;

      return (
        <Card
          className="mx-auto max-w-2xl p-6 md:p-8"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <svg
                className="h-8 w-8 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-fg">{t('errorBoundary.title')}</h2>
            <p className="text-sm text-fg-muted">{t('errorBoundary.description')}</p>
            {!canRetry && (
              <p className="text-xs text-fg-muted/80">
                Maximum retry attempts reached. Please reload the page.
              </p>
            )}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-fg-muted hover:text-fg">
                  {t('errorBoundary.errorDetails')}
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-bg-muted p-4 text-xs text-fg">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  {this.state.errorInfo &&
                    `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {canRetry && (
                <Button
                  onClick={this.handleReset}
                  variant="secondary"
                  disabled={isRetrying}
                  loading={isRetrying}
                  className="min-w-[140px]"
                >
                  {isRetrying ? t('errorBoundary.retrying') : t('errorBoundary.tryAgain')}
                </Button>
              )}
              <Button onClick={this.handleGoHome} variant="secondary" className="min-w-[140px]">
                Go to Dashboard
              </Button>
              <Button onClick={this.handleReload} className="min-w-[140px]">
                {t('errorBoundary.reloadPage')}
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
