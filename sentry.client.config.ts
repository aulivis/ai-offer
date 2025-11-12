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

          // Session Replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,

          // Release tracking
          ...(process.env.NEXT_PUBLIC_APP_VERSION && {
            release: process.env.NEXT_PUBLIC_APP_VERSION,
          }),

          // Filter out noisy errors
          ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            'atomicFindClose',
            'fb_xd_fragment',
            'bmi_SafeAddOnload',
            'EBCallBackMessageReceived',
            // Network errors
            'NetworkError',
            'Network request failed',
            // Third-party scripts
            'Non-Error promise rejection captured',
          ],

          // Filter out noisy URLs
          denyUrls: [
            // Browser extensions
            /extensions\//i,
            /^chrome:\/\//i,
            /^chrome-extension:\/\//i,
            // Third-party scripts
            /facebook\.net/i,
            /doubleclick\.net/i,
            /googlesyndication\.com/i,
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
                // Filter out abort errors (user cancelled requests)
                if (error.name === 'AbortError' || error.message.includes('aborted')) {
                  return null;
                }
              }
            }

            return event;
          },

          // Integration configuration
          integrations: [
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
            Sentry.browserTracingIntegration(),
          ],
        });
      })
      .catch((error) => {
        // Sentry not available, skip initialization
        console.warn('Sentry initialization failed:', error);
      });
  }
}
