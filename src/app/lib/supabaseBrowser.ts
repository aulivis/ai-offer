import { createClient } from '@supabase/supabase-js';
import { envClient } from '../../env.client';

export const supabaseBrowser = () => {
  const url = envClient.NEXT_PUBLIC_SUPABASE_URL;
  const key = envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
};
