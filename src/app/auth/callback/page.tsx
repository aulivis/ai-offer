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
    const hasTokenHash =
      searchParams.has('token_hash') && searchParams.has('type');

    if (!hasImplicit && !hasTokenHash) {
      // Nem érkezett szükséges paraméter
      window.location.replace('/login?message=Missing%20auth%20code');
      return;
    }

    // Átirányítás a szerveres callbackre
    const qs = searchParams.toString();
    window.location.replace(`/api/auth/callback${qs ? `?${qs}` : ''}`);
  }, []);

  // Egyszerű betöltési állapot
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <p>Finishing sign-in…</p>
    </div>
  );
}
