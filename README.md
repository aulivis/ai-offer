This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Configure the following secrets before running the application:

| Variable | Description |
| --- | --- |
| `AUTH_COOKIE_SECRET` | 32+ character secret used to encrypt OAuth state cookies and other authentication HMAC operations. |
| `CSRF_SECRET` | 32+ character secret used to sign CSRF tokens for authenticated requests. |
| `PDF_WEBHOOK_ALLOWLIST` | Comma-separated list of allowed domains/origins for PDF webhook callbacks (supports optional protocol and wildcard subdomains). |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID provisioned for the project (Web application type). |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Google OAuth 2.0 client secret paired with the configured client ID. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` | Redirect URI registered for the Google OAuth client. Use `http://127.0.0.1:54321/auth/v1/callback` when running the Supabase CLI locally, and `https://<project-ref>.supabase.co/auth/v1/callback` for hosted projects. |

### Google sign-in configuration checklist

Supabase disables OAuth providers by default. Complete the steps below before testing Google login:

1. **Create OAuth credentials in Google Cloud Console.** Choose the "Web application" type and register the
   Supabase callback URL listed above.
2. **Expose the secrets to Supabase.** Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`,
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, and `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` in your environment. The
   Supabase CLI reads these values from `.env`/`supabase/.env`, while hosted projects should define matching secrets in the
   dashboard (`Project Settings → Configuration → Auth → External OAuth Providers`).
3. **Apply the configuration.** Run `supabase db reset` (locally) or toggle the provider in the dashboard to apply the
   credentials defined in `supabase/config.toml`. The CLI command updates the local project's auth settings; the hosted
   project uses the dashboard values.
4. **Validate availability.** Visit `/api/auth/google/status` or load the login page. The UI queries this endpoint and
   disables the Google button until the provider is active, avoiding `Unsupported provider` errors when the configuration
   is incomplete.

If any step is missing, Supabase returns `{"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
when initiating the OAuth flow. The application now surfaces this condition directly in the UI.

### PDF webhook allow-list maintenance

When adding or rotating webhook integrations, update `PDF_WEBHOOK_ALLOWLIST` to include the full domain or origin (for example, `https://hooks.example.com` or `*.trusted.example`). The value is evaluated in every environment:

- Omit the protocol to default to HTTPS on the standard port.
- Prefix with `*.`, or `.`, to allow subdomains of a domain.
- Use an explicit protocol/port combination (e.g. `http://localhost:8787`) for local development callbacks.

Changes to the allow-list take effect across the API handlers, inline worker, and Supabase Edge Function, preventing jobs from being queued or dispatched to unapproved destinations.

## Subscription handling

- Subscription plans are now resolved strictly from the billing record stored for the user. Hard-coded overrides (for example, automatic `pro` access granted to specific email addresses) have been removed to keep entitlements aligned with Stripe data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Observability

### Magic link telemetry

- **Structured logging** – `/api/auth/magic-link` (OTP dispatch) and `/api/auth/callback` (magic link completion) now emit structured log entries that always include a `requestId` and, once an email address is known, an `emailHash` (SHA-256 of the normalized email). These identifiers allow you to correlate logs across retries while keeping addresses private.
- **Metrics** – Two OpenTelemetry counters are exposed via `@opentelemetry/api`:
  - `auth.magic_link.send_total` increments for every OTP send attempt. The `outcome` attribute is `success` or `failure`, and failures include a `reason` attribute (`invalid_payload`, `rate_limit`, or `supabase_error`).
  - `auth.magic_link.callback_total` tracks callback handling outcomes with the same `outcome` attribute and failure reasons (`missing_code`, `state_validation`, `exchange_error`).

### Validation guidance

1. Run the application with your OpenTelemetry meter provider configured (for example, attach an OTLP exporter or the console metric exporter).
2. Trigger a POST to `/api/auth/magic-link` followed by the magic link callback flow.
3. Confirm that server logs contain matching `requestId`/`emailHash` pairs for both the send and callback stages.
4. Verify that `auth.magic_link.send_total` and `auth.magic_link.callback_total` appear in your metrics backend with the expected `outcome`/`reason` attributes.

## GDPR & Cookies

- **CONSENT_VERSION bump policy** – Update `lib/consent/constants.ts` whenever the copy, categories, or processing purposes change. Bumping the version forces the banner to reappear, ensuring returning visitors reconfirm the latest policy. Keep the value in `NEXT_PUBLIC_CONSENT_VERSION`/`CONSENT_VERSION` aligned across environments.
- **Registering scripts behind consent** – Route any analytics or marketing pixel through a gate component under `src/components/consent`. Follow the pattern in `AnalyticsScriptGate.tsx`: check `gate.canRun()` before rendering the script and subscribe to `onConsentChange` so the embed reacts to live preference updates.
- **Proving consent** – Capture both the client cookie and server acceptance trail. The browser writes a JSON payload to the `consent` cookie (see `lib/consent/client.ts` for structure); pair that with the server log entry (or reverse-proxy trace) that issued the `Set-Cookie` header so you can prove which endpoint recorded the visitor’s choice and when.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
