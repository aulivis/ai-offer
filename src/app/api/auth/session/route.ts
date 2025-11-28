import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '../../../../../lib/auth/cookies';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { withTimeout, API_TIMEOUTS } from '@/lib/timeout';

const UNAUTHENTICATED_MESSAGE = 'A bejelentkezés lejárt vagy érvénytelen.';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    await clearAuthCookies();
    const response = NextResponse.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  // Wrap Supabase auth check in timeout to prevent hanging requests
  try {
    return await withTimeout(
      async (_signal) => {
        const supabase = await supabaseServer();

        const { data, error } = await supabase.auth.getUser(accessToken);
        if (error || !data?.user) {
          log.warn('Session validation failed', { error: error?.message });
          await clearAuthCookies();
          const response = NextResponse.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
          return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
        }

        log.setContext({ userId: data.user.id });
        const response = NextResponse.json({ user: data.user });
        return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
      },
      API_TIMEOUTS.DATABASE,
      'Session validation timed out',
    );
  } catch (error) {
    // Handle timeout and other errors
    if (error instanceof Error && error.message.includes('timed out')) {
      log.error('Session validation timed out', error);
      const response = NextResponse.json(
        { error: 'A bejelentkezés ellenőrzése túl sokáig tartott. Kérjük, próbáld újra.' },
        { status: 504 },
      );
      return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
    }

    log.error('Failed to load Supabase user', error);
    const response = NextResponse.json(
      { error: 'Nem sikerült ellenőrizni a bejelentkezést.' },
      { status: 500 },
    );
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
}
