'use client';

import { useEffect } from 'react';

/**
 * A Supabase magic link gyakran hash fragmentben (#access_token=...) küldi a tokeneket.
 * Ez a komponens kiolvassa a hash-t és/vagy query-t, majd átirányítja a hívást
 * a szerveres /api/auth/callback végpontra, hogy ott állítsuk be a HTTPOnly sütiket.
 */
function parseHashParams(hash: string): URLSearchParams {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  useEffect(() => {
    // Log the full URL for debugging (redact sensitive tokens)
    const fullUrl = window.location.href;
    const urlLength = fullUrl.length;
    const hashLength = window.location.hash.length;
    const searchLength = window.location.search.length;

    console.log('[AuthCallback] URL analysis', {
      urlLength,
      hashLength,
      searchLength,
      hasHash: !!window.location.hash,
      hasSearch: !!window.location.search,
      // Log first 200 chars of URL for debugging (without exposing full tokens)
      urlPreview: fullUrl.substring(0, 200) + (fullUrl.length > 200 ? '...' : ''),
    });

    const hashParams = parseHashParams(window.location.hash);
    const searchParams = new URLSearchParams(window.location.search);

    // Paraméterek, amelyeket a hash-ből át kell emelni a query-be
    const expected = [
      'access_token',
      'refresh_token',
      'expires_in',
      'token_hash',
      'type',
      'redirect_to',
    ] as const;

    // Helper to redact tokens in logs for security
    const redactToken = (token: string | null) => {
      if (!token) return null;
      if (token.length > 20) {
        return `${token.substring(0, 10)}...${token.substring(token.length - 10)} (length: ${token.length})`;
      }
      return `${token} (length: ${token.length})`;
    };

    console.log('[AuthCallback] Parameters received', {
      hashParams: {
        access_token: redactToken(hashParams.get('access_token')),
        refresh_token: redactToken(hashParams.get('refresh_token')),
        expires_in: hashParams.get('expires_in'),
        token_hash: hashParams.get('token_hash'),
        type: hashParams.get('type'),
      },
      searchParams: {
        access_token: redactToken(searchParams.get('access_token')),
        refresh_token: redactToken(searchParams.get('refresh_token')),
        expires_in: searchParams.get('expires_in'),
        token_hash: searchParams.get('token_hash'),
        type: searchParams.get('type'),
      },
    });

    for (const key of expected) {
      const fromHash = hashParams.get(key);
      if (fromHash && !searchParams.has(key)) {
        searchParams.set(key, fromHash);
      }
    }

    const hasImplicit =
      searchParams.has('access_token') &&
      searchParams.has('refresh_token') &&
      searchParams.has('expires_in');
    const hasTokenHash = searchParams.has('token_hash') && searchParams.has('type');

    // Log token lengths to detect truncation
    if (hasImplicit) {
      const accessToken = searchParams.get('access_token') || '';
      const refreshToken = searchParams.get('refresh_token') || '';
      const expiresIn = searchParams.get('expires_in') || '';

      console.log('[AuthCallback] Implicit flow detected', {
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
        expiresIn,
        refreshTokenPreview:
          refreshToken.substring(0, 20) + (refreshToken.length > 20 ? '...' : ''),
      });

      // Warn if refresh token seems truncated (Supabase refresh tokens are typically 100+ chars)
      if (refreshToken.length < 50) {
        console.warn('[AuthCallback] WARNING: Refresh token appears to be truncated!', {
          refreshTokenLength: refreshToken.length,
          refreshTokenValue: refreshToken,
          fullUrlLength: urlLength,
          hashLength,
          searchLength,
          message:
            'Email clients or browsers may truncate long URLs. Consider using token_hash flow instead.',
        });
      }
    }

    if (!hasImplicit && !hasTokenHash) {
      console.error('[AuthCallback] Missing required parameters', {
        hasImplicit,
        hasTokenHash,
        fullUrl: fullUrl.substring(0, 500), // Log first 500 chars
      });
      // Nem érkezett szükséges paraméter
      window.location.replace('/login?message=Missing%20auth%20code');
      return;
    }

    // Átirányítás a szerveres callbackre
    const qs = searchParams.toString();
    const callbackUrl = `/api/auth/callback${qs ? `?${qs}` : ''}`;

    console.log('[AuthCallback] Redirecting to API callback', {
      callbackUrlLength: callbackUrl.length,
      usingTokenHash: hasTokenHash,
      usingImplicit: hasImplicit,
    });

    window.location.replace(callbackUrl);
  }, []);

  // Egyszerű betöltési állapot
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <p>Finishing sign-in…</p>
    </div>
  );
}
