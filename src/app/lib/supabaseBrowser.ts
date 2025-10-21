import { createClient } from '@supabase/supabase-js';
import { envClient } from '../../env.client';

// Supabase client for browser environments.  Uses the anon key which
// provides restricted, row‑level access and is safe to expose to clients.
export const supabaseBrowser = () => {
  const url = envClient.NEXT_PUBLIC_SUPABASE_URL;
  const key = envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL vagy NEXT_PUBLIC_SUPABASE_ANON_KEY nincs beállítva!' +
      ' Ezeket az értékeket az .env file-on keresztül kell biztosítani.'
    );
  }
  return createClient(url, key);
};