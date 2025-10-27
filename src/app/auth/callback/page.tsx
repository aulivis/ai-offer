'use client';

import { t } from '@/copy';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const parsed = parseHashParams(hash);

      const access_token = parsed['access_token'] || parsed['token'] || '';
      const refresh_token = parsed['refresh_token'] || '';
      const expires_in = parsed['expires_in'] || '';

      if (!access_token) {
        window.location.replace('/login?message=Missing%20magic%20token');
        return;
      }

      const redirect_to = searchParams.get('redirect_to') ?? '/dashboard';
      const url = new URL('/api/auth/callback', window.location.origin);
      url.searchParams.set('access_token', access_token);
      if (refresh_token) url.searchParams.set('refresh_token', refresh_token);
      if (expires_in) url.searchParams.set('expires_in', expires_in);
      url.searchParams.set('redirect_to', redirect_to);

      window.location.replace(url.toString());
    } catch {
      window.location.replace('/login?message=Unable%20to%20authenticate');
    }
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center p-6">
      <p className="text-center text-base">Bejelentkezés folyamatban…</p>
    </main>
  );
}
