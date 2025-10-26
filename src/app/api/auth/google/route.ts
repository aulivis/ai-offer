import { NextResponse } from 'next/server';
import { envServer } from '@/env.server';

export async function GET() {
  try {
    const res = await fetch(`${envServer.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/providers`, {
      headers: {
        apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ enabled: true }, { status: 200 });
    }

    const providers: Array<{ id: string; enabled?: boolean }> = await res.json();
    const google = providers.find((p) => p.id === 'google');

    if (google && google.enabled !== false) {
      return NextResponse.json({ enabled: true }, { status: 200 });
    }
    return NextResponse.json({ enabled: false }, { status: 503 });
  } catch {
    return NextResponse.json({ enabled: true }, { status: 200 });
  }
}
