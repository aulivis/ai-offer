import { createServerClient } from '@supabase/ssr';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies } from 'next/headers';

import { envServer } from '../../env.server';

function createSupabaseSessionClient(cookieStore: ReadonlyRequestCookies) {
  const accessToken = cookieStore.get('propono_at')?.value;

  return createServerClient(envServer.NEXT_PUBLIC_SUPABASE_URL, envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
    },
    global: {
      headers: {
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  });
}

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createSupabaseSessionClient(cookieStore);
}

export type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;
