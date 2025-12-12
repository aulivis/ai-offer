import { z } from 'zod';

import { getNextRuntime } from '@/env.server';

const SentryEnvSchema = z.object({ NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional() });
const sentryEnv = SentryEnvSchema.parse({
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export async function register() {
  // Only load Sentry if DSN is configured
  // Use validated env helper
  if (!sentryEnv.NEXT_PUBLIC_SENTRY_DSN) {
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
