import { createClient } from '@supabase/supabase-js';
import { envServer } from '../../env.server';

// Singleton supabase client for server‑side usage.  The service role key
// provides elevated privileges (e.g. to insert or update rows) and must
// never be exposed on the client.  We validate and load these values via
// the env helper to ensure early failure if configuration is missing.
export const supabaseServer = () =>
  createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );