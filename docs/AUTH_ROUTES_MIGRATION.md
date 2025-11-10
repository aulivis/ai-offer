# Auth Routes Migration: Callback → Confirm

## Overview

This document describes the migration from `/api/auth/callback` to `/api/auth/confirm` for magic link authentication, following Supabase's recommendations for improved reliability and shorter URLs.

## Current Architecture

### Routes

- **`/api/auth/callback`** (Legacy)
  - Handles implicit flow (access_token in URL)
  - Handles token_hash flow
  - Handles OAuth PKCE code exchange
  - Currently used as fallback for legacy links

- **`/api/auth/confirm`** (Recommended)
  - Handles token_hash flow (PKCE Magic Link) - preferred for shorter URLs
  - Handles OAuth PKCE code exchange
  - Optimized for reliability and better cookie handling
  - Primary endpoint for new magic links

### Features

Both routes now have equivalent behavior:

- ✅ Session persistence with UPSERT (deduplication)
- ✅ Route usage tracking (metrics)
- ✅ CSRF token support
- ✅ Remember me functionality
- ✅ Structured logging
- ✅ Secure cookie handling
- ✅ Error handling and redirect validation

## Migration Status

### Phase 1: Dual Support ✅ Complete

- Both routes operational with equivalent behavior
- Session deduplication implemented (UPSERT)
- Route usage tracking implemented
- Backward compatibility maintained

### Phase 2: Email Template Update ✅ Complete

- Email template updated to use `/api/auth/confirm`
- Template supports token_hash flow (shorter URLs)
- Fallback to implicit flow for backward compatibility
- Template deployed to Supabase

### Phase 3: Monitoring Period 📊 Ongoing

- Monitor route usage metrics
- Track callback vs confirm route usage
- Monitor error rates
- Verify session deduplication

### Phase 4: Consolidation ⏳ Pending

- Deprecate callback route when usage drops below 5%
- Update all documentation
- Remove callback route code

## Implementation Details

### Session Deduplication

The `upsert_session()` database function handles session deduplication:

```sql
CREATE OR REPLACE FUNCTION public.upsert_session(
  p_user_id uuid,
  p_rt_hash text,
  p_issued_at timestamp with time zone,
  p_expires_at timestamp with time zone,
  p_ip text,
  p_ua text
)
RETURNS uuid
```

**Behavior**:

- Inserts new session if `rt_hash` doesn't exist
- Updates existing session if `rt_hash` already exists
- Prevents duplicate sessions during migration
- Handles concurrent requests gracefully

**Migration**: Apply database migration:

```bash
cd web
supabase migration up
```

### Route Usage Tracking

Metrics are tracked via `recordAuthRouteUsage()`:

- Tracks route name (`callback` vs `confirm`)
- Tracks flow type (`implicit`, `token_hash`, `oauth_pkce`)
- Tracks success/failure outcomes with error reasons
- Enables migration monitoring and decision-making

**Metric**: `auth.route.usage_total`

- `route`: `callback` | `confirm`
- `outcome`: `success` | `failure`
- `flow`: `implicit` | `token_hash` | `oauth_pkce`
- `error`: Error reason (if failure)

### Email Template

The email template uses Go template syntax with conditional logic:

```html
{{ if .TokenHash }}
<!-- PKCE flow: Use token_hash for shorter URLs -->
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
  Bejelentkezés
</a>
{{ else }}
<!-- Fallback to implicit flow if token_hash not available -->
<a href="{{ .ConfirmationURL }}"> Bejelentkezés </a>
{{ end }}
```

**URL Formats**:

- Token_hash flow: `https://app.example.com/api/auth/confirm?token_hash=xxx&type=email&next=/dashboard` (~200 chars)
- Implicit flow: `https://app.example.com/auth/callback?access_token=xxx&refresh_token=xxx&expires_in=3600` (~1200+ chars)

**Deployment**: Template is deployed via:

```bash
cd web
npm run email:templates:update
```

### Configuration

#### Supabase Dashboard

1. **Site URL Configuration**
   - Go to Authentication → URL Configuration
   - Set Site URL to match `APP_URL` exactly
   - Example: If `APP_URL=https://app.example.com`, Site URL = `https://app.example.com`
   - Must include protocol (https://)
   - Must match host exactly
   - No trailing slash

2. **Email Templates**
   - Magic link template uses `/api/auth/confirm` endpoint
   - Supports token_hash flow for shorter URLs
   - Falls back to implicit flow for backward compatibility

#### Environment Variables

Required for email template deployment:

- `SUPABASE_ACCESS_TOKEN` - Personal Access Token from Supabase account
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

## Authentication Flow

### Magic Link Flow (Token Hash)

1. User requests magic link via `/api/auth/magic-link`
2. Supabase sends email with token_hash (if Site URL matches)
3. User clicks link: `/api/auth/confirm?token_hash=xxx&type=email&next=/dashboard`
4. Route verifies token_hash and exchanges for session
5. Session persisted to database (UPSERT)
6. Cookies set (access token, refresh token, CSRF token)
7. Redirect to `/auth/init-session` for client-side initialization
8. Final redirect to dashboard

### Magic Link Flow (Implicit - Fallback)

1. User requests magic link via `/api/auth/magic-link`
2. Supabase sends email with ConfirmationURL (if token_hash not available)
3. User clicks link: `/auth/callback?access_token=xxx&refresh_token=xxx&expires_in=3600`
4. Client-side page redirects to `/api/auth/callback`
5. Route processes tokens and persists session
6. Cookies set and redirect to `/auth/init-session`
7. Final redirect to dashboard

### OAuth PKCE Flow

1. User initiates OAuth flow
2. Provider redirects to `/api/auth/confirm?code=xxx&next=/dashboard`
3. Route exchanges code for session
4. Session persisted to database (UPSERT)
5. Cookies set and redirect to `/auth/init-session`
6. Final redirect to dashboard

## Monitoring

### Key Metrics

1. **Route Usage**: `auth.route.usage_total`
   - Track percentage of traffic using each route
   - Target: >80% confirm route usage
   - Monitor: Callback route usage declining

2. **Error Rates**: Monitor failure rates for each route
   - Alert on spikes in failures
   - Compare error rates between routes
   - Track error types and frequencies

3. **Session Deduplication**: Monitor for duplicate sessions
   - Check database for duplicate `rt_hash` values
   - Verify UPSERT is working correctly
   - Monitor session creation logs

### Success Criteria

- ✅ Confirm route receiving >80% of new auth flows
- ✅ Callback route usage declining to <20%
- ✅ No increase in error rates
- ✅ No user complaints related to auth flows
- ✅ Session deduplication working correctly

## Testing

### Functional Tests

- [ ] Magic link (token_hash) flow with confirm route
- [ ] Magic link (implicit) flow with callback route (legacy)
- [ ] OAuth PKCE code flow with confirm route
- [ ] Password recovery (type=recovery) with confirm route
- [ ] Remember me functionality
- [ ] CSRF token handling
- [ ] Cookie persistence after redirect
- [ ] Session persistence in database
- [ ] Session deduplication (same token from both routes)

### Error Cases

- [ ] Invalid token_hash
- [ ] Expired token
- [ ] Missing tokens
- [ ] Invalid OTP type
- [ ] Redirect validation (open redirect attempts)

### Browser Compatibility

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] iOS Safari
- [ ] Android Chrome

## Troubleshooting

### Issue: TokenHash not available

**Symptoms**: Email uses long URL with `ConfirmationURL`

**Cause**: Site URL mismatch or token_hash flow not enabled

**Solution**: Verify Site URL matches `APP_URL` exactly in Supabase dashboard

### Issue: Template syntax error

**Symptoms**: Email template fails to render

**Cause**: Invalid Go template syntax

**Solution**: Check template syntax, ensure all variables are correct

### Issue: Link doesn't work

**Symptoms**: Clicking link results in error

**Cause**: Confirm route not handling request correctly

**Solution**: Check route logs, verify token_hash parameter is received

### Issue: Duplicate sessions

**Symptoms**: Multiple session records for same user

**Cause**: UPSERT function not working correctly

**Solution**: Verify `upsert_session()` function exists and is being called

## Rollback Plan

If issues are detected:

1. **Revert Email Template**
   - Change template to use `{{ .ConfirmationURL }}` only
   - Remove conditional logic
   - Deploy updated template

2. **Revert Magic Link Route**
   - Change `emailRedirectTo` back to `/auth/callback`
   - Redeploy application

3. **Investigate**
   - Check logs and metrics
   - Identify root cause
   - Fix issues

4. **Retry**
   - Fix issues
   - Retry migration after fixes

## Files Modified

### Database

- `web/supabase/migrations/20250110000000_add_session_upsert_function.sql` - UPSERT function

### Code

- `web/src/app/api/auth/callback/route.ts` - UPSERT + route tracking
- `web/src/app/api/auth/confirm/route.ts` - UPSERT + route tracking
- `web/src/app/api/auth/magic-link/route.ts` - Updated emailRedirectTo
- `web/src/lib/observability/metrics.ts` - Route usage tracking

### Templates

- `web/templates/magic-link-email-hu.html` - Updated with token_hash support

### Scripts

- `web/scripts/update-email-templates.ts` - Template deployment script

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [API Documentation](./API.md) - API endpoints

## Support

For issues or questions:

- Check metrics: `auth.route.usage_total`
- Check logs: Structured logs with route name
- Check database: Session deduplication
- Contact: Supabase support if token_hash flow issues


