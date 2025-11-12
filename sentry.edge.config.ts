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
          ignoreErrors: ['Non-Error promise rejection captured'],

          // Additional context
          beforeSend(event, _hint) {
            // Don't send events in development
            if (process.env.NODE_ENV !== 'production') {
              return null;
            }

            return event;
          },
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
