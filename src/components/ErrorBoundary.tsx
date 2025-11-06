'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Error boundary component to catch React errors gracefully
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto max-w-2xl p-8">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-600">
              An unexpected error occurred. Please try refreshing the page or contact support if the
              problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  Error details (development only)
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-slate-100 p-4 text-xs text-slate-800">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset} variant="secondary">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
