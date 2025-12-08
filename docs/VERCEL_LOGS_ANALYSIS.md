# Vercel Logs Analysis - November 28, 2025

## Summary

Analysis of Vercel production logs from Nov 28 13:06-13:13 reveals several issues affecting application performance and user experience.

## Critical Issues

### 1. Pending/Hanging Requests (`---` status)

**Affected Endpoints:**

- `/api/notifications` - Multiple requests not completing
- `/api/auth/session` - Several requests hanging

**Timeline:**

- `13:13:38.24` - GET `/api/notifications` (pending)
- `13:13:37.94` - GET `/api/auth/session` (pending)
- `13:06:13.16` - GET `/login` (pending)
- `13:06:13.15` - GET `/billing` (pending)
- `13:06:12.45` - GET `/` (pending)
- `13:06:12.32` - GET `/` (pending)

**Root Causes:**

1. **Database query timeouts**: The `/api/notifications` endpoint performs two separate queries:
   - Main query with count
   - Separate unread count query
   - Both queries may be slow on large datasets

2. **Supabase connection issues**: `/api/auth/session` calls `supabase.auth.getUser()` which may hang if:
   - Supabase service is slow/unresponsive
   - Network timeouts between Vercel and Supabase
   - Token validation taking too long

3. **No request timeouts**: The endpoints don't have explicit timeout handling

**Recommendations:**

- Add request timeouts (10-15 seconds) to all API routes
- Optimize notification queries (combine into single query with conditional counting)
- Add database query timeouts
- Implement request cancellation on client-side
- Add monitoring/alerting for slow requests

### 2. 405 Method Not Allowed Errors

**Affected Endpoints:**

- `/api/admin/pdf-jobs/reset-stuck` - GET request returned 405
- `/api/admin/pdf-jobs/process-retries` - GET request returned 405

**Timeline:**

- `13:10:46.36` - GET `/api/admin/pdf-jobs/reset-stuck` → 405
- `13:10:09.20` - GET `/api/admin/pdf-jobs/process-retries` → 405

**Root Cause:**

- These endpoints only accept POST for manual calls
- GET is only allowed for Vercel cron jobs (with Authorization header)
- Someone/something is calling these endpoints with GET without proper auth

**Current Implementation:**

```typescript
// process-retries/route.ts
export const GET = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    return processRetries(req, true);
  }
  return NextResponse.json({ error: '...' }, { status: 405 });
};
```

**Recommendations:**

- Verify if these are legitimate cron job calls (check Vercel cron configuration)
- If manual testing, use POST method
- Add better error message indicating POST is required
- Consider adding GET handler for reset-stuck endpoint (currently only POST)

### 3. 404 Not Found Errors

**Missing Resources:**

- `/video-poster.jpg` - Multiple 404 errors
- `/_next/image` - Some 404 errors (likely related to missing poster)

**Timeline:**

- `13:11:24.30` - GET `/video-poster.jpg` → 404
- `13:11:24.00` - GET `/_next/image` → 404
- `13:06:12.92` - GET `/video-poster.jpg` → 404 (multiple)

**Root Cause:**

- `VideoDemoSection` component references `/video-poster.jpg` but file doesn't exist in `public/` directory
- Component has fallback gradient, but still generates 404 errors

**Location:**

- `web/src/components/video-demo-section.tsx:41`

**Recommendations:**

- Add the missing `video-poster.jpg` file to `public/` directory, OR
- Remove the Image component and use only the gradient fallback, OR
- Update the component to handle missing image gracefully without generating 404s

### 4. Excessive Session Checks

**Pattern:**

- Multiple simultaneous `/api/auth/session` calls
- Many components checking auth status independently

**Timeline Example:**

```
13:11:28.38 - GET /api/auth/session → 200
13:11:28.38 - GET /api/auth/session → 200
13:11:28.09 - GET /api/auth/session → 200
13:11:27.79 - GET /api/auth/session → 200
13:11:27.42 - GET /api/auth/session → 200
```

**Root Causes:**

1. Multiple hooks checking auth:
   - `useAuthSession()`
   - `useOptionalAuth()` (has 5s cache)
   - `useRequireAuth()`
2. Each component mounting independently calls session endpoint
3. No shared session state across components

**Current Mitigation:**

- `useOptionalAuth` has a 5-second cache for unauthenticated state
- But authenticated checks still happen independently

**Recommendations:**

- Implement a shared session context/provider
- Use React Query or SWR for session caching
- Debounce/throttle session checks
- Consider server-side session passing to reduce client checks

### 5. 401 Unauthorized Errors

**Pattern:**

- Multiple 401 responses from `/api/auth/session`
- Followed by redirects to `/login` and `/billing`

**Timeline:**

```
13:06:14.41 - GET /api/auth/session → 401
13:06:14.30 - GET /api/auth/session → 401
13:06:13.42 - GET /api/auth/session → 401
13:06:13.23 - GET /api/auth/session → 401
13:06:13.12 - GET /api/auth/session → 401
13:06:12.86 - GET /api/auth/session → 401
13:06:12.76 - GET /api/auth/session → 401
```

**Root Causes:**

1. Expired sessions (tokens expired)
2. Missing/invalid cookies
3. User logged out but components still checking auth
4. Cookie domain/path issues

**Recommendations:**

- This is expected behavior for expired sessions
- Ensure proper redirect handling (already implemented)
- Consider reducing redundant session checks when 401 is received
- Add retry logic with exponential backoff

## Performance Impact

### Request Volume

- **High frequency**: Multiple simultaneous requests to same endpoints
- **Redundant calls**: Same data fetched multiple times
- **No request deduplication**: Each component makes independent calls

### User Experience Impact

1. **Slow page loads**: Pending requests delay page rendering
2. **Multiple loading states**: Users see loading spinners longer
3. **404 errors**: Console errors for missing images
4. **Session flicker**: Multiple auth checks cause UI state changes

## Recommended Actions

### Immediate (High Priority)

1. ✅ **Add missing video poster image** or remove reference
2. ✅ **Add request timeouts** to `/api/notifications` and `/api/auth/session`
3. ✅ **Optimize notification queries** (combine into single query)
4. ✅ **Fix admin endpoint calls** (use POST or verify cron config)

### Short-term (Medium Priority)

1. **Implement shared session context** to reduce redundant checks
2. **Add request deduplication** for concurrent identical requests
3. **Add database query timeouts** (5-10 seconds)
4. **Implement request cancellation** on component unmount
5. **Add monitoring** for slow requests (>2 seconds)

### Long-term (Low Priority)

1. **Consider React Query** for API state management
2. **Implement request batching** for multiple endpoints
3. **Add service worker** for offline session caching
4. **Optimize database indexes** for notification queries

## Monitoring Recommendations

1. **Set up alerts for:**
   - Requests taking >5 seconds
   - 405 errors on admin endpoints
   - 404 errors for static assets
   - 401 error rate >10% of session checks

2. **Track metrics:**
   - Average response time per endpoint
   - Request cancellation rate
   - Session check frequency
   - Database query performance

## Code Locations

- `/api/notifications`: `web/src/app/api/notifications/route.ts`
- `/api/auth/session`: `web/src/app/api/auth/session/route.ts`
- Admin endpoints: `web/src/app/api/admin/pdf-jobs/*/route.ts`
- Video poster: `web/src/components/video-demo-section.tsx:41`
- Auth hooks: `web/src/hooks/useAuthSession.ts`, `useOptionalAuth.ts`, `useRequireAuth.ts`


