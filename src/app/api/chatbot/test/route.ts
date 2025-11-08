import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Test route is working',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Test POST route is working',
    received: body,
  });
}

