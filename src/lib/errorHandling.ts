import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

export type StandardErrorResponse = {
  error: string;
  requestId?: string;
  issues?: unknown;
};

/**
 * Creates a standardized error response.
 * Use this for consistent error formatting across all API routes.
 */
export function createErrorResponse(
  message: string,
  status: number,
  options: {
    requestId?: string;
    issues?: unknown;
    cause?: unknown;
  } = {},
): NextResponse<StandardErrorResponse> {
  const { requestId, issues } = options;

  const response: StandardErrorResponse = {
    error: message,
    ...(requestId ? { requestId } : {}),
    ...(issues ? { issues } : {}),
  };

  return NextResponse.json(response, { status });
}

/**
 * Handles Zod validation errors and returns a standardized error response.
 */
export function handleValidationError(
  error: ZodError,
  requestId?: string,
): NextResponse<StandardErrorResponse> {
  return createErrorResponse('Érvénytelen kérés.', 400, {
    ...(requestId ? { requestId } : {}),
    issues: error.flatten(),
  });
}

/**
 * Handles unexpected errors and returns a standardized error response.
 */
export function handleUnexpectedError(
  error: unknown,
  requestId?: string,
  log?: ReturnType<typeof createLogger>,
  context?: Record<string, unknown>,
): NextResponse<StandardErrorResponse> {
  if (log) {
    log.error('Unexpected error occurred', error);
  } else {
    console.error('Unexpected error:', error);
  }

  // Report to Sentry with context (if Sentry is configured)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Dynamically import Sentry only when needed
    import('@sentry/nextjs')
      .then((Sentry) => {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            tags: {
              requestId: requestId || 'unknown',
              errorType: 'unexpected',
            },
            extra: {
              requestId,
              ...context,
            },
          });
        } else {
          Sentry.captureMessage('Unexpected error (non-Error type)', {
            level: 'error',
            tags: {
              requestId: requestId || 'unknown',
              errorType: 'unexpected',
            },
            extra: {
              requestId,
              error: String(error),
              ...context,
            },
          });
        }
      })
      .catch(() => {
        // Sentry not available, skip reporting
      });
  }

  return createErrorResponse('Váratlan hiba történt.', 500, {
    ...(requestId ? { requestId } : {}),
  });
}

/**
 * Wraps an API route handler with standardized error handling and logging.
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);

    try {
      const response = await handler(req, ...args);
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error, requestId);
      }

      // Extract request context for error reporting
      const context = {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
      };

      return handleUnexpectedError(error, requestId, log, context);
    }
  };
}
