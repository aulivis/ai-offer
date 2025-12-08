import { envClient } from '@/env.client';
import { getNextRuntime } from '@/env.server';

export async function register() {
  // Only load Sentry if DSN is configured
  // Use validated env helper
  if (!envClient.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  // Use validated env helper for runtime detection
  const nextRuntime = getNextRuntime();

  if (nextRuntime === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (nextRuntime === 'edge') {
    await import('../sentry.edge.config');
  }
}
