import { NextResponse } from 'next/server';

import { getGoogleProviderStatus } from '../providerStatus';

export async function GET() {
  const status = await getGoogleProviderStatus();
  return NextResponse.json(status, { status: status.enabled ? 200 : 503 });
}
