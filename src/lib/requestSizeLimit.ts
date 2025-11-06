import { type NextRequest, NextResponse } from 'next/server';

import { createLogger } from './logger';
import { getRequestId } from './requestId';
import type { AuthenticatedNextRequest } from '../../middleware/auth';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Middleware to enforce request size limits.
 * Checks Content-Length header and rejects oversized requests early.
 * 
 * Works with both NextRequest and AuthenticatedNextRequest.
 * When used with withAuth, the handler receives AuthenticatedNextRequest.
 */
export function withRequestSizeLimit<
  Args extends unknown[],
  RequestType extends NextRequest | AuthenticatedNextRequest = NextRequest,
>(
  handler: (req: RequestType, ...args: Args) => Promise<NextResponse>,
): (req: RequestType, ...args: Args) => Promise<NextResponse> {
  return async (req: RequestType, ...args: Args): Promise<NextResponse> => {
    const contentLength = req.headers.get('content-length');

    if (contentLength) {
      const size = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(size) && size > MAX_REQUEST_SIZE) {
        const requestId = getRequestId(req);
        const log = createLogger(requestId);
        log.warn('Request size limit exceeded', {
          contentLength: size,
          maxSize: MAX_REQUEST_SIZE,
        });
        return NextResponse.json(
          { error: 'A kérés törzse túl nagy. Maximum 10 MB engedélyezett.' },
          { status: 413 },
        );
      }
    }

    // Ensure handler is a function before calling
    if (typeof handler !== 'function') {
      const requestId = getRequestId(req);
      const log = createLogger(requestId);
      log.error('withRequestSizeLimit: handler is not a function', { handler, type: typeof handler });
      return NextResponse.json(
        { error: 'Belső szerver hiba: érvénytelen kéréskezelő.' },
        { status: 500 },
      );
    }

    return handler(req, ...args);
  };
}

