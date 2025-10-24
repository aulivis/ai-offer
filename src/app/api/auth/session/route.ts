import { cookies } from 'next/headers';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { clearAuthCookies } from '../../../../../lib/auth/cookies';

const UNAUTHENTICATED_MESSAGE = 'A bejelentkezés lejárt vagy érvénytelen.';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value ?? null;

  if (!accessToken) {
    await clearAuthCookies();
    return Response.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
  }

  const supabase = supabaseServer();

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      await clearAuthCookies();
      return Response.json({ error: UNAUTHENTICATED_MESSAGE }, { status: 401 });
    }

    return Response.json({ user: data.user });
  } catch (error) {
    console.error('Failed to load Supabase user.', error);
    return Response.json(
      { error: 'Nem sikerült ellenőrizni a bejelentkezést.' },
      { status: 500 },
    );
  }
}
