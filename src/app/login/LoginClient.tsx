'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagic() {
    setError(null);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Ismeretlen hiba');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">Bejelentkezés</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Add meg az e-mail címed, küldünk egy belépési linket.
        </p>

        <input
          className="mt-4 w-full border rounded p-2"
          type="email"
          placeholder="email@cimed.hu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendMagic}
          className="mt-3 w-full bg-black text-white rounded p-2 disabled:opacity-50"
          disabled={!email || sent}
        >
          {sent ? 'Link elküldve' : 'Magic link küldése'}
        </button>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {sent && (
          <div className="mt-3 text-sm text-green-700">
            Elkészült! Nézd meg a postaládád, és kattints a belépési linkre.
          </div>
        )}
      </div>
    </main>
  );
}
