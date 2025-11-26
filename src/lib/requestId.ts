import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';
import { createAuthRequestLogger } from '@/lib/observability/authLogging';

export const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestId(req: NextRequest | Request): string {
  const existingId = req.headers.get(REQUEST_ID_HEADER);
  if (existingId) {
    return existingId;
  }
  return randomUUID();
}

export function createRequestLogger(req: NextRequest) {
  const requestId = getRequestId(req);
  return createAuthRequestLogger({ requestId });
}
