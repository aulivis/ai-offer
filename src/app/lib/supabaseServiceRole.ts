import { createClient } from '@supabase/supabase-js';

import { envServer } from '../../env.server';

const supabaseServiceRoleClient = createClient(
  envServer.NEXT_PUBLIC_SUPABASE_URL,
  envServer.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  },
);

export const supabaseServiceRole = () => supabaseServiceRoleClient;
