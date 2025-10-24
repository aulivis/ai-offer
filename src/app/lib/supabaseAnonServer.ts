import { createClient } from '@supabase/supabase-js';

import { envServer } from '../../env.server';

// Singleton helper for creating a Supabase client that authenticates using the
// anon key.  Unlike the service-role client, this instance is safe for
// operations that do not require elevated privileges (e.g. sending OTP emails).
export const supabaseAnonServer = () =>
  createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      },
    }
  );
