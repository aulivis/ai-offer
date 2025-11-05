import { cookies } from 'next/headers';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '../../../../../lib/auth/cookies';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const UNAUTHENTICATED_MESSAGE = 'A bejelentkezés lejárt vagy érvénytelen.';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    await clearAuthCookies();
    const response = Response.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  const supabase = await supabaseServer();

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      log.warn('Session validation failed', { error: error?.message });
      await clearAuthCookies();
      const response = Response.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
      return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
    }

    log.setContext({ userId: data.user.id });
    const response = Response.json({ user: data.user });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  } catch (error) {
    log.error('Failed to load Supabase user', error);
    const response = Response.json(
      { error: 'Nem sikerült ellenőrizni a bejelentkezést.' },
      { status: 500 },
    );
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
}
