import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { currentMonthStart, getUsageWithPending } from '@/lib/services/usage';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { usageQuerySchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    const response = NextResponse.json({ error: 'Nem vagy bejelentkezve.' }, { status: 401 });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  const supabase = await supabaseServer();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    log.warn('Failed to resolve Supabase user while loading usage snapshot', { error: userError });
    const response = NextResponse.json({ error: 'Nem vagy bejelentkezve.' }, { status: 401 });
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }

  const userId = userData.user.id;
  log.setContext({ userId });
  
  // Validate query parameters
  const url = new URL(request.url);
  const queryParams = {
    period_start: url.searchParams.get('period_start') || undefined,
    device_id: url.searchParams.get('device_id') || undefined,
  };
  
  const parsed = usageQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    const response = handleValidationError(parsed.error, requestId);
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
  
  const normalizedPeriod = parsed.data.period_start || currentMonthStart().iso;
  const deviceId = parsed.data.device_id;

  try {
    const snapshot = await getUsageWithPending(supabase, {
      userId,
      periodStart: normalizedPeriod,
      deviceId,
    });

    const response = NextResponse.json(snapshot);
    return addCacheHeaders(response, CACHE_CONFIGS.USER_DATA);
  } catch (error) {
    log.error('Failed to load usage counters with pending jobs', error);
    const response = NextResponse.json(
      { error: 'Nem sikerült betölteni a használati keretet.' },
      { status: 500 },
    );
    return addCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
}
