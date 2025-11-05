'use client';

import React, { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Hiba történt</h1>
            <p className="mb-4 text-gray-600">
              Sajnáljuk, valami hiba történt. Kérlek, frissítsd az oldalt vagy próbáld újra később.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 overflow-auto rounded bg-gray-100 p-4 text-left text-sm">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Oldal frissítése
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
