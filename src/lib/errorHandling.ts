import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { ApiError } from '@/lib/api';
import { t } from '@/copy';

export type StandardErrorResponse = {
  error: string;
  requestId?: string;
  issues?: unknown;
};

/**
 * Common HTTP status codes for error responses
 */
export const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Creates a standardized error response.
 * Use this for consistent error formatting across all API routes.
 */
export function createErrorResponse(
  message: string,
  status: number = HttpStatus.INTERNAL_SERVER_ERROR,
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

  const nextResponse = NextResponse.json(response, { status });
  if (requestId) {
    nextResponse.headers.set('x-request-id', requestId);
  }
  return nextResponse;
}

/**
 * Handles Zod validation errors and returns a standardized error response.
 */
export function handleValidationError(
  error: ZodError,
  requestId?: string,
): NextResponse<StandardErrorResponse> {
  return createErrorResponse('Érvénytelen kérés.', HttpStatus.BAD_REQUEST, {
    ...(requestId ? { requestId } : {}),
    issues: error.flatten(),
  });
}

/**
 * Handles ApiError instances and returns a standardized error response.
 */
export function handleApiError(
  error: ApiError,
  requestId?: string,
  log?: ReturnType<typeof createLogger>,
): NextResponse<StandardErrorResponse> {
  if (log) {
    log.error('API error occurred', error, {
      status: error.status,
    });
  }

  const status = error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
  return createErrorResponse(error.message, status, {
    ...(requestId ? { requestId } : {}),
  });
}

/**
 * Handles Supabase errors and returns a standardized error response.
 */
export function handleSupabaseError(
  error: { message?: string; code?: string; details?: string; hint?: string },
  requestId?: string,
  log?: ReturnType<typeof createLogger>,
  defaultMessage: string = t('errors.database.operationFailed'),
): NextResponse<StandardErrorResponse> {
  if (log) {
    log.error('Supabase error occurred', error, {
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  // Map common Supabase error codes to HTTP status codes
  const statusMap: Record<string, number> = {
    PGRST116: HttpStatus.NOT_FOUND, // No rows returned
    '23505': HttpStatus.CONFLICT, // Unique violation
    '23503': HttpStatus.BAD_REQUEST, // Foreign key violation
    '23514': HttpStatus.BAD_REQUEST, // Check constraint violation
  };

  const status =
    error.code && statusMap[error.code] ? statusMap[error.code] : HttpStatus.INTERNAL_SERVER_ERROR;

  return createErrorResponse(error.message || defaultMessage, status, {
    ...(requestId ? { requestId } : {}),
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
    log.error('Unexpected error occurred', error, context);
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

  return createErrorResponse('Váratlan hiba történt.', HttpStatus.INTERNAL_SERVER_ERROR, {
    ...(requestId ? { requestId } : {}),
  });
}

/**
 * Handles any error type and returns a standardized error response.
 * This is a convenience function that routes to the appropriate handler.
 */
export function handleError(
  error: unknown,
  requestId?: string,
  log?: ReturnType<typeof createLogger>,
  context?: Record<string, unknown>,
): NextResponse<StandardErrorResponse> {
  if (error instanceof ZodError) {
    return handleValidationError(error, requestId);
  }

  if (error instanceof ApiError) {
    return handleApiError(error, requestId, log);
  }

  // Check if it's a Supabase error
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    ('code' in error || 'details' in error || 'hint' in error)
  ) {
    return handleSupabaseError(
      error as { message?: string; code?: string; details?: string; hint?: string },
      requestId,
      log,
    );
  }

  return handleUnexpectedError(error, requestId, log, context);
}

/**
 * Wraps an API route handler with standardized error handling and logging.
 * This works with both regular NextRequest and AuthenticatedNextRequest.
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
      // Extract request context for error reporting
      const context = {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
      };

      return handleError(error, requestId, log, context);
    }
  };
}

/**
 * Wraps an authenticated API route handler with standardized error handling.
 * This is designed to work with withAuth middleware.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(
 *   withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
 *     // Your handler code
 *   })
 * );
 * ```
 */
export function withAuthenticatedErrorHandling<Args extends unknown[], Result extends NextResponse>(
  handler: (
    req: NextRequest & { user: { id: string; email: string | null } },
    ...args: Args
  ) => Promise<Result> | Result,
) {
  return async (
    req: NextRequest & { user: { id: string; email: string | null } },
    ...args: Args
  ): Promise<Result> => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id });

    try {
      const response = await handler(req, ...args);
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      // Extract request context for error reporting
      const context = {
        method: req.method,
        url: req.url,
        userId: req.user.id,
        userEmail: req.user.email,
        headers: Object.fromEntries(req.headers.entries()),
      };

      return handleError(error, requestId, log, context) as Result;
    }
  };
}
