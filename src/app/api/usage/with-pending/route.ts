import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { currentMonthStart, getUsageWithPending } from '@/lib/services/usage';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    return NextResponse.json({ error: 'Nem vagy bejelentkezve.' }, { status: 401 });
  }

  const supabase = await supabaseServer();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    console.warn('Failed to resolve Supabase user while loading usage snapshot.', userError);
    return NextResponse.json({ error: 'Nem vagy bejelentkezve.' }, { status: 401 });
  }

  const userId = userData.user.id;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const providedPeriod = searchParams.get('period_start');
  const deviceIdParam = searchParams.get('device_id');
  const normalizedPeriod =
    providedPeriod && providedPeriod.trim().length > 0 ? providedPeriod : currentMonthStart().iso;
  const deviceId = deviceIdParam && deviceIdParam.trim().length > 0 ? deviceIdParam : undefined;

  try {
    const snapshot = await getUsageWithPending(supabase, {
      userId,
      periodStart: normalizedPeriod,
      deviceId,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Failed to load usage counters with pending jobs.', { userId, error });
    return NextResponse.json(
      { error: 'Nem sikerült betölteni a használati keretet.' },
      { status: 500 },
    );
  }
}
