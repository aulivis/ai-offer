export type DecodedRefreshToken = {
  sub?: string;
  iat?: number;
  exp?: number;
};

export function decodeRefreshToken(token: string): DecodedRefreshToken | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as DecodedRefreshToken;

    return payload;
  } catch (error) {
    console.error('Failed to decode refresh token.', error);
    return null;
  }
}
