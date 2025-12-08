import { NextRequest, NextResponse } from 'next/server';
import { envServer } from '@/env.server';
import { withErrorHandling } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

/**
 * API endpoint to verify redirect URI configuration.
 * This helps ensure the OAuth redirect URI is correctly configured.
 *
 * GET /api/auth/verify-redirect-uri
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const configuredUri = envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI;
  const supabaseUrl = envServer.NEXT_PUBLIC_SUPABASE_URL;

  // Extract project ref from Supabase URL
  const supabaseUrlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const projectRef = supabaseUrlMatch?.[1] || 'unknown';

  // Expected Supabase callback URI pattern
  const expectedSupabaseCallback = `${supabaseUrl}/auth/v1/callback`;

  // Check if configured URI matches expected pattern
  const matchesSupabaseCallback = configuredUri.includes('/auth/v1/callback');
  const isLocalhost = configuredUri.includes('localhost') || configuredUri.includes('127.0.0.1');
  const isSecure = configuredUri.startsWith('https://') || isLocalhost;

  const verification = {
    configuredUri,
    expectedSupabaseCallback,
    supabaseUrl,
    projectRef,
    matchesSupabaseCallback,
    isSecure,
    isLocalhost,
    isValid: matchesSupabaseCallback && isSecure,
    recommendations: [] as string[],
  };

  if (!matchesSupabaseCallback) {
    verification.recommendations.push(
      'The configured redirect URI should include "/auth/v1/callback" path',
    );
  }

  if (!isSecure && !isLocalhost) {
    verification.recommendations.push(
      'The redirect URI should use HTTPS in production (localhost is OK for development)',
    );
  }

  // Check if URI matches our callback endpoint
  const appUrl = new URL(envServer.APP_URL);
  const expectedAppCallback = `${appUrl.origin}/api/auth/callback`;
  const matchesAppCallback = configuredUri === expectedAppCallback;

  if (!matchesAppCallback) {
    verification.recommendations.push(
      `Consider using "${expectedAppCallback}" as the redirect URI to match your app's callback endpoint`,
    );
  }

  log.info('Redirect URI verification', {
    configuredUri,
    isValid: verification.isValid,
    recommendationsCount: verification.recommendations.length,
  });

  return NextResponse.json({
    ...verification,
    message: verification.isValid
      ? 'Redirect URI configuration looks good'
      : 'Redirect URI configuration may need attention',
  });
});
