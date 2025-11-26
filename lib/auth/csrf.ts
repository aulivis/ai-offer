import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

import { envServer } from '@/env.server';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const TOKEN_DELIMITER = '.';

function getSecret(): string {
  const secret = envServer.CSRF_SECRET;
  if (!secret) {
    throw new Error('CSRF secret is not configured.');
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

function signToken(token: string): string {
  return createHmac('sha256', getSecret()).update(token).digest('hex');
}

export function createCsrfToken(): { token: string; value: string } {
  const token = randomBytes(32).toString('hex');
  const signature = signToken(token);
  return { token, value: `${token}${TOKEN_DELIMITER}${signature}` };
}

export function verifyCsrfToken(
  headerToken: string | null,
  cookieValue: string | undefined,
): boolean {
  if (!headerToken || !cookieValue) {
    return false;
  }

  const delimiterIndex = cookieValue.indexOf(TOKEN_DELIMITER);
  if (delimiterIndex <= 0) {
    return false;
  }

  const token = cookieValue.slice(0, delimiterIndex);
  const signature = cookieValue.slice(delimiterIndex + 1);
  if (!token || !signature) {
    return false;
  }

  if (!safeEqual(token, headerToken)) {
    return false;
  }

  const expectedSignature = signToken(token);
  return safeEqual(expectedSignature, signature);
}
