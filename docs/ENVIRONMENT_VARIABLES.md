# Environment Variables

This document describes all environment variables used in the application, their purpose, and whether they are required or optional.

## Overview

The application uses validated environment variable helpers to ensure type safety and prevent runtime errors from missing or invalid configuration. All environment variables should be accessed through the validated helpers:

- **Client-side**: Use `envClient` from `@/env.client`
- **Server-side**: Use `envServer` from `@/env.server`
- **Runtime detection**: Use helper functions from `@/env.server` (e.g., `isVercelEnvironment()`, `isServerlessEnvironment()`)

**Never use `process.env` directly in application code.** The only exceptions are:

- Standard Node.js variables like `NODE_ENV` (used for development/production checks)
- Build-time configuration files (e.g., `next.config.ts`)
- Infrastructure detection variables (handled by helper functions)
- Standalone scripts (e.g., `scripts/*.ts`) that run outside the Next.js application context
- Test setup files (e.g., `vitest.setup.ts`) that need to set environment variables

## Required Environment Variables (Production)

These variables must be set in production environments. Missing variables will cause the application to fail at startup.

### Supabase Configuration

| Variable                        | Type         | Description                        | Validation          |
| ------------------------------- | ------------ | ---------------------------------- | ------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | string (URL) | Supabase project URL               | Must be a valid URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string       | Supabase anonymous key (public)    | Required, non-empty |
| `SUPABASE_SERVICE_ROLE_KEY`     | string       | Supabase service role key (secret) | Required, non-empty |

### Authentication & Security

| Variable                     | Type   | Description                               | Validation            |
| ---------------------------- | ------ | ----------------------------------------- | --------------------- |
| `AUTH_COOKIE_SECRET`         | string | Secret for signing authentication cookies | Minimum 32 characters |
| `CSRF_SECRET`                | string | Secret for CSRF token generation          | Minimum 32 characters |
| `MAGIC_LINK_RATE_LIMIT_SALT` | string | Salt for magic link rate limiting         | Minimum 16 characters |

### External Services

| Variable            | Type   | Description                      | Validation          |
| ------------------- | ------ | -------------------------------- | ------------------- |
| `OPENAI_API_KEY`    | string | OpenAI API key for AI generation | Required, non-empty |
| `STRIPE_SECRET_KEY` | string | Stripe secret key for payments   | Required, non-empty |

### Application Configuration

| Variable                                     | Type           | Description                  | Validation            |
| -------------------------------------------- | -------------- | ---------------------------- | --------------------- |
| `APP_URL`                                    | string (URL)   | Base URL of the application  | Must be a valid URL   |
| `PUBLIC_CONTACT_EMAIL`                       | string (email) | Public contact email address | Must be a valid email |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` | string (URL)   | Google OAuth redirect URI    | Must be a valid URL   |

## Optional Environment Variables

These variables have default values or are only needed for specific features.

### Stripe Configuration

| Variable                                  | Type                     | Description                                      | Default     |
| ----------------------------------------- | ------------------------ | ------------------------------------------------ | ----------- |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER`        | string                   | Stripe price ID for Starter plan                 | `undefined` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO`            | string                   | Stripe price ID for Pro plan                     | `undefined` |
| `NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL` | string                   | Stripe price ID for Starter annual plan          | `undefined` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL`     | string                   | Stripe price ID for Pro annual plan              | `undefined` |
| `STRIPE_PRICE_ALLOWLIST`                  | string (comma-separated) | Comma-separated list of allowed Stripe price IDs | Empty array |

### Analytics & Monitoring

| Variable                        | Type         | Description                              | Default     |
| ------------------------------- | ------------ | ---------------------------------------- | ----------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | string       | Google Analytics measurement ID          | `undefined` |
| `NEXT_PUBLIC_SENTRY_DSN`        | string (URL) | Sentry DSN for error tracking            | `undefined` |
| `NEXT_PUBLIC_APP_VERSION`       | string       | Application version for release tracking | `undefined` |

### Security & Access Control

| Variable                   | Type                     | Description                                         | Default     |
| -------------------------- | ------------------------ | --------------------------------------------------- | ----------- |
| `OAUTH_REDIRECT_ALLOWLIST` | string (comma-separated) | Comma-separated list of allowed OAuth redirect URIs | Empty array |
| `PDF_WEBHOOK_ALLOWLIST`    | string (comma-separated) | Comma-separated list of allowed PDF webhook URLs    | Empty array |

### Advanced Configuration

| Variable                      | Type          | Description                                         | Default     |
| ----------------------------- | ------------- | --------------------------------------------------- | ----------- |
| `EXTERNAL_API_SYSTEM_USER_ID` | string (UUID) | System user ID for external API PDF generation      | `undefined` |
| `VERCEL_CRON_SECRET`          | string        | Secret token for verifying Vercel cron job requests | `undefined` |

### Build-Time Configuration

| Variable         | Type   | Description                                 | Default     |
| ---------------- | ------ | ------------------------------------------- | ----------- |
| `SENTRY_ORG`     | string | Sentry organization (for source maps)       | `undefined` |
| `SENTRY_PROJECT` | string | Sentry project (for source maps)            | `undefined` |
| `ANALYZE`        | string | Enable bundle analyzer (`'true'` to enable) | `undefined` |

## Infrastructure Detection Variables

These variables are automatically set by the hosting platform and are used for runtime detection. They should not be set manually and are accessed through helper functions:

- `VERCEL` - Set to `'1'` when running on Vercel
- `VERCEL_ENV` - Vercel environment (production, preview, development)
- `AWS_LAMBDA_FUNCTION_NAME` - Set when running on AWS Lambda
- `NEXT_RUNTIME` - Next.js runtime (nodejs, edge)

**Usage:**

```typescript
import { isVercelEnvironment, isServerlessEnvironment, getNextRuntime } from '@/env.server';

if (isVercelEnvironment()) {
  // Vercel-specific logic
}

if (isServerlessEnvironment()) {
  // Serverless-specific logic
}

const runtime = getNextRuntime(); // 'nodejs' | 'edge' | undefined
```

## Standard Node.js Variables

These are standard Node.js environment variables that don't require validation:

- `NODE_ENV` - Node.js environment (`'development'`, `'production'`, or `'test'`)
  - Used throughout the codebase for development/production checks
  - Safe to use directly: `process.env.NODE_ENV === 'production'`

## Development Defaults

In development, the application uses default values for required variables to allow local development without full configuration. These defaults are defined in `src/env.server.ts` and should **never** be used in production.

## Validation

All environment variables are validated using Zod schemas:

- **Client variables**: Validated in `src/env.client.ts`
- **Server variables**: Validated in `src/env.server.ts`

Validation occurs at module load time. Invalid or missing required variables will cause the application to fail with descriptive error messages.

## Migration Guide

If you're updating code that uses `process.env` directly:

1. **Client-side code**: Replace `process.env.NEXT_PUBLIC_*` with `envClient.NEXT_PUBLIC_*`
2. **Server-side code**: Replace `process.env.*` with `envServer.*`
3. **Infrastructure detection**: Use helper functions from `@/env.server`
4. **NODE_ENV checks**: Can remain as `process.env.NODE_ENV` (standard Node.js variable)

### Example Migration

**Before:**

```typescript
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Sentry logic
}
```

**After:**

```typescript
import { envClient } from '@/env.client';

if (envClient.NEXT_PUBLIC_SENTRY_DSN) {
  // Sentry logic
}
```

## Security Notes

1. **Never commit secrets**: All environment variables containing secrets should be stored securely and never committed to version control.
2. **Client vs Server**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the client bundle. Never include secrets in these variables.
3. **Validation**: Always use validated helpers to ensure type safety and prevent undefined access.
4. **Defaults**: Development defaults are for local development only. Production must have all required variables set.

## Troubleshooting

### "Environment variable validation failed"

This error indicates a required variable is missing or invalid. Check:

1. All required variables are set in your environment
2. Variable values match the expected format (URLs, emails, etc.)
3. String length requirements are met (e.g., `AUTH_COOKIE_SECRET` must be at least 32 characters)

### "Cannot find module '@/env.client' or '@/env.server'"

Ensure you're importing from the correct file:

- Client components: `@/env.client`
- Server components/API routes: `@/env.server`

### Variables not updating

After changing environment variables:

1. Restart the development server
2. Clear Next.js cache if needed: `rm -rf .next`
3. For production, redeploy the application
