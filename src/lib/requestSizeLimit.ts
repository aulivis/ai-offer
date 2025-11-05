import { type NextRequest, NextResponse } from 'next/server';

import { createLogger } from './logger';
import { getRequestId } from './requestId';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Middleware to enforce request size limits.
 * Checks Content-Length header and rejects oversized requests early.
 */
export async function withRequestSizeLimit<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
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

    return handler(req, ...args);
  };
}

