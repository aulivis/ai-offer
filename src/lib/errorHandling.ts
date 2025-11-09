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
    ...(requestId && { requestId }),
    ...(issues && { issues }),
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
    requestId,
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
): NextResponse<StandardErrorResponse> {
  if (log) {
    log.error('Unexpected error occurred', error);
  } else {
    console.error('Unexpected error:', error);
  }

  return createErrorResponse('Váratlan hiba történt.', 500, { requestId });
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

      return handleUnexpectedError(error, requestId, log);
    }
  };
}
