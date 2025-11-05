import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check database connectivity
    const supabase = supabaseServiceRole();
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      console.error('Health check failed: database error', error);
      return NextResponse.json(
        { status: 'unhealthy', error: 'Database connectivity check failed' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('Health check failed', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 503 },
    );
  }
}

