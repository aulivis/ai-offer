# Magic Link URL Investigation Summary

## Issue Identified

The refresh token in magic link URLs is being truncated to only **12 characters** (e.g., `fbl2qpdjkkjo`), which is insufficient for authentication. Supabase refresh tokens are typically **100+ characters** long.

## Root Cause: URL Truncation

Magic links use the **implicit flow** which includes full tokens in the URL:
- Access token: ~866 characters (JWT)
- Refresh token: ~100-200 characters  
- Total URL: **1,200+ characters**

**Email clients and browsers may truncate long URLs**, causing the refresh token to be cut off.

## Changes Made

### 1. Fixed Cookie Setting (✅ Completed)
- Changed from manual `Set-Cookie` headers to Next.js `response.cookies.set()` API
- This ensures cookies are properly set on redirect responses
- File: `web/src/app/api/auth/callback/route.ts`

### 2. Added Comprehensive Logging (✅ Completed)
- **Client-side** (`web/src/app/auth/callback/page.tsx`):
  - Logs full URL length and parameters
  - Detects truncated refresh tokens (< 50 chars)
  - Warns when truncation is detected
  - Logs which flow is being used (implicit vs token_hash)

- **Server-side** (`web/src/app/api/auth/callback/route.ts`):
  - Logs all URL parameters received
  - Logs token lengths
  - Warns about suspiciously short refresh tokens

- **Magic link request** (`web/src/app/api/auth/magic-link/route.ts`):
  - Logs callback URL and configuration
  - Documents flow type behavior

### 3. Documentation (✅ Completed)
- Created `web/docs/MAGIC_LINK_URL_TRUNCATION_INVESTIGATION.md`
- Comprehensive guide on URL truncation issues
- Solutions and workarounds

## How to Verify the Issue

### Step 1: Request a Magic Link
1. Request a magic link from your application
2. Check your email inbox

### Step 2: Inspect the Magic Link URL
1. **Right-click the magic link** in the email and "Copy link address"
2. **Paste it into a text editor** to see the full URL
3. **Check the URL length**:
   - Implicit flow: ~1,200+ characters (contains `access_token=...&refresh_token=...`)
   - Token hash flow: ~200 characters (contains `token_hash=...&type=magiclink`)

4. **Check if the URL is truncated**:
   - Does it end abruptly?
   - Is the refresh token complete?
   - Compare the URL in email vs after copying

### Step 3: Check Browser Console
1. **Click the magic link** (or paste the URL in browser)
2. **Open browser developer tools** (F12)
3. **Check the Console tab** for:
   - `[AuthCallback] URL analysis` - shows URL length
   - `[AuthCallback] Parameters received` - shows token lengths
   - `[AuthCallback] WARNING: Refresh token appears to be truncated!` - if truncation detected

### Step 4: Check Server Logs
1. **Check API route logs** for `/api/auth/callback`
2. Look for:
   - `Magic link callback URL parameters` - shows what was received
   - `refreshTokenLength` - should be 100+ characters
   - Warnings about short refresh tokens

## Solutions

### Solution 1: Use Token Hash Flow (Recommended)

The code **already supports token_hash flow**, which produces much shorter URLs (~200 chars vs 1,200+ chars).

**To enable token_hash flow:**

1. **Check Supabase Dashboard**:
   - Go to Authentication > Settings
   - Verify Site URL matches your production URL
   - Check Redirect URLs include your callback URL
   - Look for "Use PKCE" or "Token Hash Flow" settings

2. **Check Supabase Configuration**:
   - Token hash flow is typically used when:
     - Redirect URL doesn't exactly match Site URL
     - PKCE is enabled
     - Email template uses token_hash

3. **Test**:
   - Request a new magic link
   - Check if URL contains `token_hash` (good) or `access_token` (problematic)
   - Verify URL is ~200 characters (good) vs 1,200+ (problematic)

### Solution 2: Verify Email Client Behavior

1. **Test in multiple email clients**:
   - Gmail (web and mobile)
   - Outlook
   - Apple Mail
   - Mobile email clients

2. **Check if URLs are truncated**:
   - Some email clients truncate URLs in display but preserve full URL when clicked
   - Some truncate URLs when copying
   - Some truncate URLs in the actual link

3. **Workaround**:
   - If email client truncates, users can manually copy the full URL
   - Or use token_hash flow (shorter URLs, less prone to truncation)

### Solution 3: Environment URL Length Limits

**Check your environment:**

1. **Next.js**: No specific limit (uses Node.js defaults)
2. **Vercel**: Supports up to 8,192 characters
3. **Node.js**: Very high limit (not an issue)
4. **Browsers**: 2,000-65,536 characters (varies)

**Your environment should handle 1,200+ character URLs**, so the issue is likely email client truncation, not server limits.

## Next Steps

1. **Test the current implementation**:
   - Request a magic link
   - Check browser console for logs
   - Verify if token_hash or implicit flow is being used
   - Check if refresh token is truncated

2. **If truncation is detected**:
   - Check Supabase dashboard configuration
   - Verify email template settings
   - Consider using token_hash flow
   - Test in multiple email clients

3. **Monitor**:
   - Watch for truncation warnings in logs
   - Track magic link success/failure rates
   - Monitor cookie setting success

## Files Modified

1. `web/src/app/api/auth/callback/route.ts`:
   - Fixed cookie setting to use Next.js API
   - Added URL parameter logging
   - Added refresh token length validation

2. `web/src/app/auth/callback/page.tsx`:
   - Added comprehensive client-side logging
   - Added truncation detection
   - Added URL analysis

3. `web/src/app/api/auth/magic-link/route.ts`:
   - Added logging for magic link requests
   - Added documentation about flow types

4. `web/docs/MAGIC_LINK_URL_TRUNCATION_INVESTIGATION.md`:
   - Comprehensive investigation guide
   - Solutions and workarounds

## Expected Behavior After Fix

1. **Cookies should persist** after redirect (fixed with Next.js cookie API)
2. **Logging should show**:
   - URL length and parameters
   - Token lengths
   - Truncation warnings (if any)
   - Which flow is being used

3. **If token_hash flow is used**:
   - URLs should be ~200 characters
   - Less prone to truncation
   - More reliable across email clients

4. **If implicit flow is used**:
   - URLs will be ~1,200+ characters
   - May be truncated by email clients
   - Logs will warn if truncation is detected

## Testing Checklist

- [ ] Request magic link and check email
- [ ] Verify URL length and format
- [ ] Check browser console for logs
- [ ] Verify cookies are set after callback
- [ ] Test login flow completes successfully
- [ ] Check server logs for truncation warnings
- [ ] Test in multiple email clients
- [ ] Verify session persists after redirect

## Support

If issues persist:
1. Check browser console logs for `[AuthCallback]` messages
2. Check server logs for magic link callback errors
3. Verify Supabase dashboard configuration
4. Test with token_hash flow if available
5. Check email client behavior with long URLs

