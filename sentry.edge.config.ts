// Only initialize Sentry if DSN is provided
{
  // Use validated env helper - safe to import in edge config
  import('@/env.client')
    .then(({ envClient }) => {
      const sentryDsn = envClient.NEXT_PUBLIC_SENTRY_DSN;
      if (!sentryDsn) {
        return;
      }

      // Dynamically import Sentry to avoid build errors when not installed
      return import('@sentry/nextjs')
        .then((Sentry) => {
          Sentry.init({
            dsn: sentryDsn,
            environment: process.env.NODE_ENV,
            enabled: process.env.NODE_ENV === 'production',

            // Performance Monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

            // Release tracking
            ...(envClient.NEXT_PUBLIC_APP_VERSION && {
              release: envClient.NEXT_PUBLIC_APP_VERSION,
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
          // eslint-disable-next-line no-console
          console.warn('Sentry initialization failed:', error);
        });
    })
    .catch(() => {
      // envClient not available, skip Sentry initialization
    });
}

// Make this file a valid ES module
export {};
