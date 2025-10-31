'use client';

import { useEffect } from 'react';

function parseHashParams(hash: string): URLSearchParams {
  // hash pl.: "#access_token=...&refresh_token=...&expires_in=3600&type=magiclink&token_hash=..."
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export default function AuthCallbackPage() {
  useEffect(() => {
    // 1) Hash + query összefűzés (biztos, ami biztos)
    const hashParams = parseHashParams(window.location.hash);
    const searchParams = new URLSearchParams(window.location.search);

    // 2) Ha a hash-ben vannak Supabase paramok, emeljük át
    const expected = [
      'access_token',
      'refresh_token',
      'expires_in',
      'token_hash',
      'type',
      'redirect_to',
    ] as const;

    let foundAny = false;
    for (const key of expected) {
      const fromHash = hashParams.get(key);
      if (fromHash && !searchParams.has(key)) {
        searchParams.set(key, fromHash);
        foundAny = true;
      }
    }

    // 3) Ha semmi sincs se hash-ben, se query-ben → hibára vissza a loginra
    const hasImplicit =
      searchParams.has('access_token') &&
      searchParams.has('refresh_token') &&
      searchParams.has('expires_in');
    const hasTokenHash = searchParams.has('token_hash') && searchParams.has('type');

    if (!hasImplicit && !hasTokenHash) {
      window.location.replace('/login?message=Missing%20auth%20code');
      return;
    }

    // 4) Továbbítás a szerveres API callbackre — itt állítjuk a HTTPOnly sütiket
    const qs = searchParams.toString();
    window.location.replace(`/api/auth/callback${qs ? `?${qs}` : ''}`);
  }, []);

  // Minimal „loading” állapot
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <p>Finishing sign-in…</p>
    </div>
  );
}
