import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withErrorHandling } from '@/lib/errorHandling';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  // Check database connectivity
  const supabase = supabaseServiceRole();
  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
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
});
