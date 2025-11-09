# Email Template URL Truncation Fix

## Issue Identified

The custom magic link email template (`templates/magic-link-email-hu.html`) may be contributing to URL truncation issues. While the template correctly uses `{{ .ConfirmationURL }}`, there are several potential problems:

1. **Email Client Rendering**: Long URLs in email templates can be truncated by email clients
2. **Template Character Limits**: Supabase may have limits on template variable length
3. **URL Encoding**: Very long URLs may not be fully preserved in email rendering
4. **Word Break CSS**: `word-break: break-all` may cause display issues

## Current Template Analysis

### Line 55: Button Link
```html
<a href="{{ .ConfirmationURL }}" 
   style="display: inline-block; padding: 18px 48px; background-color: #1c274c; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; line-height: 1.5; border-radius: 8px; border: 2px solid #1c274c;">
  Bejelentkezés
</a>
```
✅ **Correct**: Uses `{{ .ConfirmationURL }}` variable

### Line 75: Fallback Link
```html
<a href="{{ .ConfirmationURL }}" style="color: #1c274c; text-decoration: underline; font-size: 12px; font-family: monospace; word-break: break-all;">{{ .ConfirmationURL }}</a>
```
⚠️ **Potential Issue**: 
- `word-break: break-all` may cause email clients to truncate the displayed URL
- The URL is shown as text, which email clients may truncate in preview
- Very long URLs may be cut off in email rendering

## Solutions

### Solution 1: Use Token Hash Flow (Recommended)

The best solution is to configure Supabase to use the **token_hash flow** instead of the implicit flow. This produces much shorter URLs (~200 characters vs 1,200+ characters) that are less prone to truncation.

**How to enable token_hash flow:**

1. **Check Supabase Dashboard**:
   - Go to Authentication > Settings
   - Look for "Flow Type" or "PKCE" settings
   - Enable PKCE flow if available

2. **Verify Configuration**:
   - Token hash flow is typically used when:
     - PKCE is enabled
     - Redirect URL doesn't exactly match Site URL
     - Email template uses token_hash variables

3. **Test**:
   - Request a new magic link
   - Check if URL contains `token_hash` (good) or `access_token` (problematic)
   - Verify URL is ~200 characters (good) vs 1,200+ (problematic)

### Solution 2: Improve Template Fallback Link

Modify the template to better handle long URLs:

```html
<!-- Alternative link (if button doesn't work) -->
<div style="margin: 0 0 40px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px; border-left: 4px solid #1c274c;">
  <p style="margin: 0 0 12px 0; padding: 0; color: #4a5568; font-size: 14px; font-weight: 600;">
    💡 Ha a gomb nem működik
  </p>
  <p style="margin: 0 0 8px 0; padding: 0; color: #718096; font-size: 13px; line-height: 1.6;">
    Másold be az alábbi linket a böngésződbe:
  </p>
  <p style="margin: 0; padding: 0; background-color: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; overflow-x: auto;">
    <a href="{{ .ConfirmationURL }}" 
       style="color: #1c274c; text-decoration: underline; font-size: 12px; font-family: monospace; display: block; word-break: break-word; white-space: pre-wrap; overflow-wrap: break-word;">
      {{ .ConfirmationURL }}
    </a>
  </p>
</div>
```

**Key changes**:
- Removed `word-break: break-all` (can cause truncation)
- Added `word-break: break-word` (better for URLs)
- Added `white-space: pre-wrap` (preserves URL structure)
- Added `overflow-wrap: break-word` (handles long URLs better)
- Added container with `overflow-x: auto` (allows horizontal scrolling if needed)

### Solution 3: Use Short Link Service (Alternative)

If token_hash flow is not available, consider using a URL shortening service:

1. **Create a short link endpoint** in your application
2. **Store the full URL** in a database with a short ID
3. **Use the short link** in the email template
4. **Redirect to the full URL** when the short link is clicked

**Example**:
```html
<a href="https://yourdomain.com/auth/link/{{ .ShortLinkID }}">Bejelentkezés</a>
```

Then create an endpoint that redirects:
```typescript
// /api/auth/link/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Look up full URL from database
  const fullUrl = await getFullUrl(params.id);
  // Redirect to full URL
  return NextResponse.redirect(fullUrl);
}
```

### Solution 4: Verify Template Variable

Ensure Supabase is not truncating the `{{ .ConfirmationURL }}` variable:

1. **Check Supabase Dashboard**:
   - Go to Authentication > Email Templates
   - Verify the template is using `{{ .ConfirmationURL }}` (not a truncated version)
   - Check if there are any character limits on template variables

2. **Test Template Rendering**:
   - Create a test email with a very long URL
   - Verify the full URL is included in the rendered email
   - Check if Supabase is truncating the URL before inserting it into the template

## Testing

### Test 1: Verify URL Length in Email

1. Request a magic link
2. Check the email source (view raw email)
3. Search for the confirmation URL
4. Verify the URL is complete (not truncated)
5. Check the URL length

### Test 2: Test Button vs Fallback Link

1. Click the button in the email
2. Verify the full URL is used
3. Try copying the fallback link
4. Verify the copied URL is complete
5. Compare both URLs

### Test 3: Test in Multiple Email Clients

1. Send test emails to:
   - Gmail (web and mobile)
   - Outlook
   - Apple Mail
   - Mobile email clients
2. Verify URLs are not truncated in any client
3. Test both button and fallback link

## Recommended Fix

**Priority 1: Enable Token Hash Flow**
- This is the best long-term solution
- Produces shorter URLs that are less prone to truncation
- More reliable across email clients

**Priority 2: Improve Template Fallback Link**
- Update the template to better handle long URLs
- Use better CSS for URL display
- Ensure URLs are not truncated in email rendering

**Priority 3: Add Logging**
- Log the URL length when generating magic links
- Log the URL received in the callback
- Monitor for truncation issues

## Implementation Steps

1. **Update Email Template**:
   ```bash
   # Update the template file
   # Then update in Supabase
   npm run email:templates:update
   ```

2. **Test Template**:
   - Request a magic link
   - Verify the email looks correct
   - Check if URLs are complete

3. **Configure Token Hash Flow** (if available):
   - Check Supabase dashboard
   - Enable PKCE flow
   - Test with new magic links

4. **Monitor**:
   - Watch for truncation warnings in logs
   - Track magic link success rates
   - Monitor email delivery

## Related Files

- `web/templates/magic-link-email-hu.html` - Email template
- `web/scripts/update-email-templates.ts` - Template update script
- `web/src/app/api/auth/callback/route.ts` - Callback handler
- `web/src/app/auth/callback/page.tsx` - Client-side callback page

## References

- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)
- [Email URL Best Practices](https://www.emailonacid.com/blog/article/email-development/long-urls-in-email/)

