# Magic Link URL Truncation Investigation

## Problem Summary

The refresh token in magic link URLs is being truncated to only 12 characters (e.g., `fbl2qpdjkkjo`), which is insufficient for authentication. Supabase refresh tokens are typically 100+ characters long.

## Root Cause

### URL Length Limits

1. **Email Clients**: Many email clients truncate URLs that exceed certain character limits:
   - Gmail: ~2,048 characters (but may truncate in display)
   - Outlook: ~2,083 characters
   - Some email clients: 255 characters or less
   - Mobile email clients: Often more restrictive

2. **Browser Limits**: 
   - Modern browsers: ~2,000 characters (though some support up to 65,536)
   - Older browsers: 2,048 characters
   - URL copying/pasting: May truncate long URLs

3. **Magic Link URL Structure**:
   ```
   https://your-app.com/auth/callback#access_token=EYJ...&refresh_token=VERY_LONG_TOKEN...&expires_in=3600&type=magiclink
   ```
   - Access token: ~866 characters (JWT)
   - Refresh token: ~100-200 characters
   - Total URL length: Can easily exceed 1,200+ characters

### Supabase Magic Link Flows

Supabase supports two magic link flows:

1. **Implicit Flow** (Current - Problematic):
   - Tokens are included directly in the URL: `access_token=...&refresh_token=...`
   - URLs are very long (1,200+ characters)
   - Prone to truncation by email clients
   - **This is what's currently being used**

2. **Token Hash Flow** (Recommended):
   - Only a short `token_hash` and `type` are included in the URL
   - URLs are much shorter (~200 characters)
   - Less prone to truncation
   - Tokens are exchanged server-side via `verifyOtp()`

## Investigation Steps

### 1. Check Magic Link Email URL

When testing magic link login:

1. **Request a magic link** from your application
2. **Open the email** in your email client
3. **Inspect the URL**:
   - Right-click the magic link and "Copy link address"
   - Check the URL length
   - Verify if tokens are in the URL (implicit flow) or just token_hash (hash flow)
   - Check if the URL appears truncated

4. **Check Browser Console**:
   - Open browser developer tools
   - Look for `[AuthCallback]` logs when clicking the magic link
   - Check for warnings about truncated refresh tokens

### 2. Check URL Length Limits

#### Email Client Testing:
- Test in multiple email clients (Gmail, Outlook, Apple Mail, etc.)
- Test on mobile devices
- Check if URLs are truncated in the email display
- Verify if copying/pasting the URL preserves the full length

#### Environment Limits:
- **Next.js**: No specific URL length limit (uses Node.js defaults)
- **Vercel**: Supports URLs up to 8,192 characters
- **Node.js**: Default URL length limit is quite high
- **Browsers**: Varies (see above)

### 3. Verify Supabase Configuration

Check your Supabase project settings:

1. **Authentication > URL Configuration**:
   - Site URL: Should match your production URL
   - Redirect URLs: Should include your callback URL
   - **Important**: Ensure `http://localhost:3000/auth/callback` is in redirect URLs for local development

2. **Authentication > Providers > Email**:
   - Magic Link: Should be enabled
   - Email Template: Check if custom template is truncating URLs

3. **Database** (if using custom email):
   - Check `auth.email_templates` table
   - Verify magic link template doesn't truncate URLs

## Solution: Use Token Hash Flow

### Why Token Hash Flow is Better

1. **Shorter URLs**: ~200 characters vs 1,200+ characters
2. **Less Prone to Truncation**: Email clients less likely to truncate
3. **More Secure**: Tokens not exposed in URL (though hash fragments aren't sent to server anyway)
4. **Better UX**: Links work more reliably across email clients

### Implementation

The code already supports token_hash flow! It's implemented in `/api/auth/callback/route.ts`:

```typescript
// Magic link verifyOtp (token_hash)
const tokenHash = url.searchParams.get('token_hash');
if (tokenHash) {
  const otpType = normalizeOtpType(url.searchParams.get('type'));
  // ... verifyOtp and exchange for tokens
}
```

### Configure Supabase to Use Token Hash Flow

**Option 1: Use PKCE Flow (Recommended)**

Modify the magic link request to use PKCE:

```typescript
// In /api/auth/magic-link/route.ts
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: publicCallback.toString(),
    shouldCreateUser: true,
    // Add flowType: 'pkce' to use PKCE flow (shorter URLs)
    flowType: 'pkce', // This uses token_hash instead of implicit flow
  },
});
```

**Option 2: Configure Supabase Dashboard**

1. Go to Supabase Dashboard > Authentication > Settings
2. Find "Email Auth" settings
3. Enable "Use PKCE for email links" (if available)
4. Or configure to use token_hash flow by default

**Option 3: Custom Email Template**

If using custom email templates, ensure the template uses token_hash flow:
- Use `{{ .TokenHash }}` instead of `{{ .Token }}`
- Include `type=magiclink` parameter

### Verify Token Hash Flow is Working

After implementing, check:

1. **Magic link URL length**: Should be ~200 characters
2. **URL parameters**: Should contain `token_hash` and `type`, not `access_token` and `refresh_token`
3. **Browser logs**: Should show `usingTokenHash: true` in `[AuthCallback]` logs
4. **Server logs**: Should show "Processing magic link tokens (token_hash flow)"

## Current Implementation Status

### ✅ Already Implemented

1. **Token Hash Flow Support**: Code handles `token_hash` flow correctly
2. **Cookie Setting**: Fixed to use Next.js `response.cookies.set()` API
3. **Logging**: Added comprehensive logging to detect truncation
4. **Error Handling**: Handles both implicit and token_hash flows

### ⚠️ Needs Configuration

1. **Supabase Configuration**: May need to enable PKCE/token_hash flow in Supabase
2. **Magic Link Request**: May need to add `flowType: 'pkce'` option
3. **Testing**: Need to verify token_hash flow works end-to-end

## Testing Checklist

- [ ] Request magic link and check email URL length
- [ ] Verify URL contains `token_hash` (not `access_token`)
- [ ] Test in multiple email clients (Gmail, Outlook, mobile)
- [ ] Check browser console for truncation warnings
- [ ] Verify cookies are set correctly after callback
- [ ] Test login flow completes successfully
- [ ] Verify session persists after redirect

## Debugging

### Check Logs

1. **Browser Console** (Client-side):
   - Look for `[AuthCallback]` logs
   - Check `refreshTokenLength` value
   - Look for truncation warnings

2. **Server Logs** (API route):
   - Check `/api/auth/callback` logs
   - Look for "Magic link callback URL parameters"
   - Check `refreshTokenLength` in logs
   - Verify token_hash flow is being used

### Common Issues

1. **URL Truncated in Email**:
   - Solution: Use token_hash flow (shorter URLs)
   - Workaround: Provide alternative login method

2. **Refresh Token Too Short**:
   - Check if URL was truncated
   - Verify token_hash flow is being used
   - Check Supabase configuration

3. **Cookies Not Set**:
   - Verify cookie attributes (sameSite, secure, path)
   - Check if cookies are being set on redirect response
   - Verify browser accepts cookies

## Next Steps

1. **Test Current Implementation**: 
   - Request a magic link
   - Check browser console for logs
   - Verify if token_hash or implicit flow is being used

2. **Configure Supabase**:
   - Enable PKCE flow if available
   - Or modify magic link request to use token_hash flow

3. **Monitor**:
   - Watch for truncation warnings in logs
   - Track magic link success/failure rates
   - Monitor cookie setting success

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [URL Length Limits](https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers)

