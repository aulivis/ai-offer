# Sentry Error Tracking Setup

This document describes how to set up and configure Sentry for error tracking in the application.

## Overview

Sentry is integrated into the application to provide:

- Error tracking and monitoring
- Performance monitoring
- Session replay
- Release tracking
- Source map support

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project (select "Next.js" as the platform)
3. Copy your DSN from the project settings

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file and deployment platform:

#### Required for Production

```env
# Sentry DSN (public, safe to expose in client bundle)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Sentry Organization (for source map uploads)
SENTRY_ORG=your-org-slug

# Sentry Project (for source map uploads)
SENTRY_PROJECT=your-project-slug

# Sentry Auth Token (for source map uploads - keep secret!)
SENTRY_AUTH_TOKEN=your-auth-token

# Optional: App version for release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Optional Configuration

```env
# Sentry environment (defaults to NODE_ENV)
SENTRY_ENVIRONMENT=production

# Sentry release (defaults to git commit SHA)
SENTRY_RELEASE=1.0.0
```

### 3. Install Dependencies

The Sentry dependencies are already included in `package.json`. If you need to install manually:

```bash
npm install @sentry/nextjs
```

### 4. Verify Installation

1. Start the development server: `npm run dev`
2. Trigger an error in the application
3. Check your Sentry dashboard for the error

## Configuration Files

### Sentry Configuration Files

- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `src/instrumentation.ts` - Next.js instrumentation hook

### Error Handling Integration

Sentry is integrated into:

- `src/lib/errorHandling.ts` - API route error handling
- `src/components/ErrorBoundary.tsx` - React error boundaries
- `next.config.ts` - Build configuration with source map upload

## Features

### Error Tracking

Errors are automatically captured from:

- API routes (via `handleUnexpectedError`)
- React components (via `ErrorBoundary`)
- Server-side code
- Edge runtime code

### Performance Monitoring

- Transaction sampling: 10% in production, 100% in development
- Automatic instrumentation of Next.js routes
- Database query tracking (if configured)

### Session Replay

- 10% of sessions are recorded
- 100% of error sessions are recorded
- Text and media are masked for privacy

### Source Maps

Source maps are automatically uploaded during build when:

- `SENTRY_ORG` and `SENTRY_PROJECT` are set
- `SENTRY_AUTH_TOKEN` is provided
- Building in production mode

## Filtering and Ignoring Errors

### Ignored Errors

The following errors are automatically ignored:

- Browser extension errors
- Network errors (aborted requests)
- Validation errors (ZodError)
- Non-critical errors

### Custom Filtering

You can customize error filtering in the Sentry config files:

- `beforeSend` hook - Filter errors before sending
- `ignoreErrors` - List of error patterns to ignore
- `denyUrls` - List of URL patterns to ignore

## Monitoring and Alerts

### Setting Up Alerts

1. Go to your Sentry project settings
2. Navigate to "Alerts"
3. Create alerts for:
   - Error rate spikes
   - New error types
   - Performance degradation
   - Release issues

### Dashboards

Create custom dashboards to monitor:

- Error rates by endpoint
- Performance metrics
- User impact
- Release health

## Best Practices

### 1. Use Request IDs

All errors include request IDs for correlation:

```typescript
Sentry.captureException(error, {
  tags: {
    requestId: requestId,
  },
});
```

### 2. Add Context

Include relevant context in error reports:

```typescript
Sentry.captureException(error, {
  extra: {
    userId: user.id,
    endpoint: '/api/example',
    requestBody: requestBody,
  },
});
```

### 3. Filter Sensitive Data

Never include sensitive data in error reports:

- Passwords
- API keys
- Credit card numbers
- Personal information

### 4. Use Tags for Filtering

Use tags to filter and group errors:

```typescript
Sentry.captureException(error, {
  tags: {
    errorType: 'validation',
    endpoint: '/api/users',
    environment: 'production',
  },
});
```

### 5. Monitor Performance

Track performance metrics:

- Page load times
- API response times
- Database query times
- Third-party API calls

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify that errors are not being filtered out
3. Check browser console for Sentry initialization errors
4. Verify network requests to Sentry are not blocked

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set correctly
2. Check that source maps are being uploaded during build
3. Verify source map upload in build logs
4. Check Sentry project settings for source map configuration

### Performance Issues

1. Reduce transaction sampling rate if needed
2. Disable session replay if not needed
3. Filter out noisy transactions
4. Optimize error reporting frequency

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Tracking Guide](https://docs.sentry.io/product/issues/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)

## Support

For issues or questions:

1. Check the [Sentry documentation](https://docs.sentry.io/)
2. Review the configuration files in the repository
3. Contact the development team
