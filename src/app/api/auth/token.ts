import { logger } from '@/lib/logger';

export type DecodedRefreshToken = {
  sub?: string;
  iat?: number;
  exp?: number;
};

export function decodeRefreshToken(token: string): DecodedRefreshToken | null {
  try {
    const parts = token.split('.');
    // JWT tokens should have exactly 3 parts: header.payload.signature
    // However, we only need the payload (parts[1]) for validation
    // Accept tokens with at least 2 parts (header.payload) for robustness
    if (parts.length < 2) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as DecodedRefreshToken;

    return payload;
  } catch (error) {
    // Log error in development but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to decode refresh token', error);
    }
    return null;
  }
}
