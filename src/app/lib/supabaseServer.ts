import { createClient } from '@supabase/supabase-js';
import { envServer } from '../../env.server';

export const supabaseServer = () =>
  createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
