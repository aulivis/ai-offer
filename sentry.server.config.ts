// Only initialize Sentry if DSN is provided
{
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    // Dynamically import Sentry to avoid build errors when not installed
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV,
          enabled: process.env.NODE_ENV === 'production',

          // Performance Monitoring
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

          // Release tracking
          ...(process.env.NEXT_PUBLIC_APP_VERSION && {
            release: process.env.NEXT_PUBLIC_APP_VERSION,
          }),

          // Filter out noisy errors
          ignoreErrors: [
            // Database connection errors (handled separately)
            'ECONNREFUSED',
            'ETIMEDOUT',
            // Non-critical errors
            'Non-Error promise rejection captured',
          ],

          // Additional context
          beforeSend(event, hint) {
            // Don't send events in development
            if (process.env.NODE_ENV !== 'production') {
              return null;
            }

            // Filter out known non-critical errors
            if (event.exception) {
              const error = hint.originalException;
              if (error instanceof Error) {
                // Filter out validation errors (already handled)
                if (error.name === 'ZodError') {
                  return null;
                }
                // Filter out abort errors
                if (error.name === 'AbortError' || error.message.includes('aborted')) {
                  return null;
                }
              }
            }

            return event;
          },

          // Integration configuration
          // Note: nodeProfilingIntegration requires @sentry/profiling-node package
          // integrations: [nodeProfilingIntegration()],
        });
      })
      .catch((error) => {
        // Sentry not available, skip initialization
        console.warn('Sentry initialization failed:', error);
      });
  }
}

// Make this file a valid ES module
export {};
