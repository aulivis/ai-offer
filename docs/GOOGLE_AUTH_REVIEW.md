# Google OAuth with Supabase - Implementation Review

## Overview
This document compares our Google OAuth implementation against Supabase and Google OAuth 2.0 best practices and identifies potential issues.

## Current Implementation Summary

### 1. Google OAuth Flow Initiation (`/api/auth/google/route.ts`)

**What we do:**
- ✅ Generate PKCE code verifier (64 bytes, base64url encoded)
- ✅ Generate code challenge (SHA-256 hash of verifier, base64url encoded)
- ✅ Store code verifier in HttpOnly cookie (`sb_pkce_code_verifier`)
- ✅ Redirect to Supabase `/auth/v1/authorize` with:
  - `provider=google`
  - `redirect_to` (callback URL)
  - `code_challenge` (S256 method)
  - `code_challenge_method=s256` (lowercase)

**Comparison with Supabase Docs:**
- ✅ Correct PKCE implementation
- ✅ Correct code challenge method (`s256` is correct, not `S256`)
- ✅ Proper cookie storage (HttpOnly, Secure, SameSite=Lax)

### 2. OAuth Callback Handling (`/api/auth/callback/route.ts`)

**What we do:**
1. Extract `code` from query parameters
2. Retrieve `code_verifier` from cookie
3. Exchange code with Supabase `/auth/v1/token` endpoint:
   - `grant_type=pkce`
   - `auth_code=code`
   - `code_verifier=verifier`
   - `redirect_uri=callback_url`
4. Receive `access_token`, `refresh_token`, `expires_in`
5. Decode JWT to get `user_id`
6. Persist session in database (`sessions` table)
7. Set custom cookies (`propono_at`, `propono_rt`)
8. Redirect to dashboard

**Comparison with Supabase Docs:**
- ✅ Correct token exchange flow
- ✅ Proper PKCE code verification
- ✅ Correct redirect URI matching

**⚠️ Potential Issues:**
1. **Session Synchronization**: After setting cookies, we redirect to dashboard but the browser's Supabase client session might not be initialized yet
2. **Cookie-to-Session Gap**: Custom cookie names (`propono_at`, `propono_rt`) require explicit session initialization in the browser client
3. **Timing Issue**: Dashboard loads before Supabase client session is initialized from cookies

### 3. Session Initialization (`/lib/supabaseClient.ts`)

**What we do:**
- Custom Supabase client that reads from custom cookies
- `ensureSession()` function that:
  1. Checks for existing session
  2. If missing, reads `propono_at` and `propono_rt` from cookies
  3. Calls `client.auth.setSession()` with tokens
  4. Verifies session was set correctly

**Comparison with Supabase Docs:**
- ⚠️ **Non-standard approach**: Supabase client normally handles session persistence automatically
- ⚠️ **Custom cookie names**: Requires manual session sync
- ✅ Good retry logic for session verification

**⚠️ Issues Identified:**
1. **Race Condition**: After OAuth callback, cookies are set server-side, but client-side session initialization happens asynchronously
2. **Session State**: The `sessionInitialized` flag might be stale if cookies change
3. **Error Handling**: If `setSession()` fails silently, we might not detect it immediately

### 4. Google Cloud Console Configuration

**Required Settings:**
- ✅ OAuth 2.0 Client ID (Web application)
- ✅ Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- ⚠️ **Custom redirect URI**: We use `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` which might differ

**Recommended Settings:**
- OAuth consent screen configured
- Scopes: `openid`, `email`, `profile`
- Authorized domains configured

## Issues and Recommendations

### Issue 1: Session Not Initialized After OAuth Callback

**Problem:**
After Google OAuth completes, cookies are set but the Supabase client session isn't initialized when the dashboard loads.

**Root Cause:**
1. OAuth callback sets cookies server-side
2. Redirects to dashboard
3. Dashboard loads and calls `ensureSession()`
4. `ensureSession()` might run before cookies are available or before session can be set

**Solution:**
1. **Add client-side session initialization in callback page**: Before redirecting, ensure the client initializes the session
2. **Improve cookie-to-session sync**: Add a small delay or retry logic after redirect
3. **Use Supabase's built-in session detection**: Consider using Supabase's default cookie names if possible

### Issue 2: Custom Cookie Names vs Supabase Defaults

**Problem:**
Using `propono_at` and `propono_rt` instead of Supabase's default cookie names requires manual session management.

**Current Approach:**
- ✅ More control over cookie settings
- ✅ Can implement custom expiration logic
- ✅ Can add additional security measures

**Supabase Default Approach:**
- ✅ Automatic session management
- ✅ Built-in session refresh
- ✅ Less code to maintain

**Recommendation:**
If custom cookies are necessary for security/compliance, ensure:
1. Session initialization happens reliably after OAuth
2. Add proper error handling and retry logic
3. Consider using Supabase's session storage adapter pattern

### Issue 3: PKCE Code Verifier Storage

**Current Implementation:**
- Stores verifier in `sb_pkce_code_verifier` cookie
- 5-minute expiration
- HttpOnly, Secure, SameSite=Lax

**Supabase Documentation:**
- Supabase client libraries handle PKCE automatically
- They use localStorage or sessionStorage by default
- Cookie-based storage is acceptable but requires careful handling

**Comparison:**
- ✅ Our approach is secure (HttpOnly cookies)
- ⚠️ Must ensure cookie is available when callback is received
- ⚠️ Cookie might expire if OAuth flow takes too long

### Issue 4: Redirect URI Configuration

**Current Implementation:**
```typescript
const callbackUrl = new URL(envServer.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI);
callbackUrl.searchParams.set('redirect_to', finalRedirect);
```

**Supabase Documentation:**
- Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback`
- Our callback: `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI`

**Verification Needed:**
1. Ensure `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` matches Supabase's expected callback
2. Verify Google Cloud Console has this URI authorized
3. Ensure the redirect URI in the token exchange matches exactly

## Recommended Fixes

### Fix 1: Improve Session Initialization After OAuth

**In `/api/auth/callback/route.ts`:**
```typescript
// After setting cookies, add a small script to initialize session client-side
// Or redirect to an intermediate page that initializes the session before redirecting to dashboard
```

**In `/lib/supabaseClient.ts`:**
```typescript
// Improve ensureSession to handle post-OAuth scenarios better
// Add exponential backoff for retries
// Add better logging for debugging
```

### Fix 2: Add Client-Side Session Sync

**Create `/app/auth/callback/page.tsx`:**
- Client component that runs after OAuth redirect
- Initializes Supabase session from cookies
- Waits for session to be confirmed
- Then redirects to dashboard

### Fix 3: Verify Redirect URI Configuration

**Check:**
1. `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` matches Supabase dashboard settings
2. Google Cloud Console has the exact URI authorized
3. The redirect URI in token exchange matches the one used in authorization request

### Fix 4: Add Better Error Handling

**In session initialization:**
- Log when cookies are found but session can't be set
- Provide user-friendly error messages
- Add retry logic with exponential backoff
- Consider falling back to redirect to login if session can't be established

## Supabase Documentation References

1. **Google OAuth Setup**: https://supabase.com/docs/guides/auth/social-login/auth-google
2. **PKCE Flow**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
3. **Session Management**: https://supabase.com/docs/guides/auth/sessions

## Google OAuth Documentation References

1. **OAuth 2.0 for Web Applications**: https://developers.google.com/identity/protocols/oauth2/web-server
2. **PKCE**: https://developers.google.com/identity/protocols/oauth2/native-app#step1-code-verifier
3. **Redirect URIs**: https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation

## Critical Finding: OAuth Callback Flow

**Current Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google redirects to `/api/auth/callback?code=...` (server route)
4. Server route:
   - Exchanges code for tokens
   - Sets cookies (`propono_at`, `propono_rt`)
   - Redirects to `/dashboard`
5. Dashboard loads and tries to query offers
6. `ensureSession()` tries to initialize session from cookies
7. **PROBLEM**: Session might not be initialized yet, or cookies might not be available immediately

**The Issue:**
The OAuth callback is handled entirely server-side (`/api/auth/callback` route). After setting cookies and redirecting, the browser's Supabase client hasn't initialized its session yet. When the dashboard loads and calls `ensureSession()`, there's a race condition where:
- Cookies might not be immediately available (browser cookie propagation)
- Session initialization might not complete before the first query
- The `sessionInitialized` flag might be stale

**Solution Options:**

### Option 1: Add Client-Side Session Initialization (Recommended)
Modify `/api/auth/callback` to redirect to an intermediate page that initializes the session:

```typescript
// In /api/auth/callback/route.ts
// After setting cookies, redirect to:
return redirectTo('/auth/init-session?redirect=' + encodeURIComponent(finalRedirect));

// Create /app/auth/init-session/page.tsx (client component)
// This page:
// 1. Waits for cookies to be available
// 2. Calls ensureSession() to initialize Supabase client
// 3. Verifies session is ready
// 4. Redirects to the final destination
```

### Option 2: Improve ensureSession() Reliability
The current fixes in `supabaseClient.ts` should help, but we can improve further:
- Add longer retry delays for post-OAuth scenarios
- Check cookie availability before trying to set session
- Add exponential backoff

### Option 3: Use Supabase's Default Session Handling
Consider using Supabase's default cookie names and session storage, which handles OAuth flows automatically.

## Conclusion

Our implementation follows most best practices but has a critical issue with session initialization timing after OAuth. The main problem is that cookies are set server-side, but the client-side Supabase session isn't initialized before the dashboard tries to use it.

**Root Cause:**
The OAuth callback flow is entirely server-side. After redirecting to the dashboard, the browser's Supabase client needs time to:
1. Detect the new cookies
2. Initialize the session via `setSession()`
3. Verify the session is active

This creates a race condition where the dashboard queries run before the session is ready.

**Priority Fixes:**
1. ✅ **HIGH**: Add client-side session initialization page after OAuth callback
2. ✅ **HIGH**: Improve `ensureSession()` retry logic for post-OAuth scenarios
3. ✅ **MEDIUM**: Verify redirect URI configuration matches exactly
4. ✅ **LOW**: Add better error handling and user-facing messages

**Immediate Action:**
The fixes already implemented in `supabaseClient.ts` should help, but we should also add a client-side initialization step after OAuth to ensure the session is ready before redirecting to the dashboard.

