# Architecture Documentation

## System Overview

This application is a Next.js-based SaaS platform for generating professional business offers using AI assistance. The system generates PDF offers and manages user subscriptions.

## Architecture Components

### Frontend
- **Framework:** Next.js 15.5.6 (React 19)
- **Styling:** Tailwind CSS 4
- **State Management:** React hooks and context
- **Type Safety:** TypeScript with strict mode

### Backend
- **Runtime:** Next.js API Routes (Node.js)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with custom session management
- **Storage:** Supabase Storage
- **PDF Generation:** Puppeteer (inline worker + Edge Function)
- **AI Integration:** OpenAI API

### Infrastructure
- **Hosting:** Vercel (presumed)
- **Database:** Supabase PostgreSQL
- **Edge Functions:** Supabase Edge Functions (Deno runtime)
- **CDN:** Vercel Edge Network

## Security Architecture

### Authentication Flow

1. **Magic Link Authentication:**
   - User requests magic link via `/api/auth/magic-link`
   - Email sent with authentication token
   - Token validated, cookies set
   - Refresh token stored in database with Argon2 hash

2. **Session Management:**
   - Access tokens stored in HTTP-only cookies
   - Refresh tokens stored in database with Argon2 hashing
   - Token rotation on refresh
   - Session revocation on logout or reuse detection

3. **CSRF Protection:**
   - HMAC-SHA256 signed tokens
   - Token in cookie + header (double submit pattern)
   - Required for all state-changing operations

### Authorization

- **Row Level Security (RLS):** All tables enforce RLS policies
- **User Isolation:** All queries filtered by `user_id`
- **Resource Ownership:** Explicit checks before operations

### Input Validation

- **Schema Validation:** Zod schemas for all inputs
- **HTML Sanitization:** Custom allow-list based sanitizer
- **URL Validation:** Strict URL scheme validation
- **File Validation:** MIME type and size checks

### Rate Limiting

- **Database-Backed:** Rate limits stored in PostgreSQL
- **Automatic Cleanup:** Expired entries removed periodically
- **Per-Endpoint:** Different limits for different endpoints
- **Headers:** Rate limit information in responses

## Data Flow

### PDF Generation Flow

1. **Request:** User submits offer data via `/api/ai-generate`
2. **Validation:** Input validated and sanitized
3. **Usage Check:** Quota checked (user + device limits)
4. **Job Creation:** PDF job created in database
5. **HTML Generation:** Template engine generates HTML
6. **Processing:**
   - Attempt Edge Function (preferred)
   - Fallback to inline worker if Edge Function unavailable
7. **PDF Generation:** Puppeteer renders HTML to PDF
8. **Storage:** PDF uploaded to Supabase Storage
9. **Completion:** Job marked complete, usage incremented
10. **Webhook:** Optional webhook notification sent

### Usage Tracking

- **User Counters:** `usage_counters` table tracks monthly usage
- **Device Counters:** `device_usage_counters` table tracks per-device limits
- **Atomic Operations:** Database functions ensure consistency
- **Rollback:** Usage increments rolled back on failure

## Database Schema

### Core Tables

- **offers:** User-generated offers
- **pdf_jobs:** PDF generation job queue
- **sessions:** Refresh token sessions
- **usage_counters:** User-level usage tracking
- **device_usage_counters:** Device-level usage tracking
- **audit_logs:** Security audit trail
- **api_rate_limits:** Rate limiting storage
- **recipients:** Client/recipient information
- **profiles:** User profile and subscription data

### Key Indexes

- Composite indexes on `(user_id, status)` for offers
- Indexes on `(user_id, created_at)` for pagination
- Indexes on `(status, created_at)` for job processing
- Indexes on `(user_id, period_start)` for usage queries

## Error Handling

### Standardized Error Responses

All errors follow consistent format:
```json
{
  "error": "Human-readable message",
  "requestId": "uuid",
  "issues": {} // Optional validation details
}
```

### Error Types

- **Validation Errors:** 400 with field-level details
- **Authentication Errors:** 401 with clear messages
- **Authorization Errors:** 403 with context
- **Rate Limit Errors:** 429 with retry information
- **Server Errors:** 500 with request ID for tracking

### Logging

- **Structured Logging:** JSON format in production
- **Request Context:** Request IDs for correlation
- **Error Tracking:** Errors logged with stack traces
- **Audit Trail:** Sensitive operations logged to audit table

## Performance Considerations

### Caching

- **Template Listing:** Cached for 1 hour
- **User Data:** Cached for 5 minutes
- **Static Assets:** Long-term caching

### Optimization

- **Database Indexes:** Optimized for common query patterns
- **Connection Pooling:** Supabase handles connection pooling
- **Edge Functions:** PDF generation offloaded to Edge
- **Streaming:** AI preview streams responses

### Monitoring

- **Template Telemetry:** Track template render performance
- **Usage Metrics:** Track API usage patterns
- **Error Tracking:** Structured error logs
- **Health Checks:** Database connectivity monitoring

## Security Model

### Defense in Depth

1. **Input Validation:** Schema validation at API boundary
2. **Authentication:** Token-based auth with CSRF protection
3. **Authorization:** RLS policies + explicit checks
4. **Sanitization:** HTML/URL sanitization before storage
5. **Rate Limiting:** Prevent abuse and DoS
6. **Audit Logging:** Track sensitive operations

### Security Headers

- **CSP:** Content Security Policy restricts resources
- **HSTS:** Force HTTPS connections
- **X-Content-Type-Options:** Prevent MIME sniffing
- **Referrer-Policy:** Control referrer information
- **Permissions-Policy:** Restrict browser features

## Deployment

### Environment Variables

**Required (Production):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_COOKIE_SECRET` (min 32 chars)
- `CSRF_SECRET` (min 32 chars)
- `MAGIC_LINK_RATE_LIMIT_SALT` (min 16 chars)
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `APP_URL`
- `PUBLIC_CONTACT_EMAIL`
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI`

**Optional:**
- `STRIPE_PRICE_ALLOWLIST` (comma-separated)
- `OAUTH_REDIRECT_ALLOWLIST` (comma-separated)
- `PDF_WEBHOOK_ALLOWLIST` (comma-separated)

### Build Process

1. Type checking with TypeScript
2. Linting with ESLint
3. Code formatting with Prettier
4. Build with Next.js
5. Deploy to hosting platform

## Development

### Testing

- **Unit Tests:** Vitest for utility functions
- **Integration Tests:** End-to-end API tests
- **Security Tests:** Security control verification
- **Template Tests:** Golden file tests for PDF templates

### Code Quality

- **Type Safety:** Strict TypeScript configuration
- **Linting:** ESLint with custom rules
- **Formatting:** Prettier for consistent formatting
- **Pre-commit:** Husky hooks for quality checks

## Future Improvements

- [ ] Database query optimization based on production metrics
- [ ] Comprehensive integration test suite
- [ ] Security penetration testing
- [ ] API documentation with OpenAPI/Swagger
- [ ] Performance monitoring and alerting
- [ ] Rate limit tuning based on usage patterns










