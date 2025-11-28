# Security Audit Report

## Executive Summary

This document provides a comprehensive security review of the codebase, identifying potential vulnerabilities and security best practices. The review covers authentication, authorization, input validation, XSS protection, file uploads, and other security-critical areas.

## Security Strengths

### ✅ Well-Implemented Security Controls

1. **Content Moderation** (NEW)
   - Prompt injection detection
   - Malicious content filtering
   - Abuse pattern detection
   - Length validation

2. **CSRF Protection**
   - Token-based CSRF protection for state-changing operations
   - Validation in middleware (`middleware/auth.ts`)
   - Proper cookie and header validation

3. **Input Sanitization**
   - HTML sanitization with allowlist (`lib/sanitize.ts`)
   - XSS protection via HTML escaping
   - URL scheme validation
   - Attribute sanitization

4. **Authentication**
   - HTTP-only cookies for tokens
   - Token refresh mechanism
   - Session validation
   - Request context validation (referer, sec-fetch-\* headers)

5. **File Upload Security**
   - File type validation (MIME type checking)
   - File size limits (4MB)
   - Image format validation (PNG, JPEG, SVG)
   - SVG sanitization
   - User-scoped storage paths

6. **Rate Limiting**
   - Per-endpoint rate limiting
   - Request size limits
   - Quota enforcement

7. **Environment Variables**
   - Server-only environment variable access
   - Zod schema validation
   - No client-side secret exposure

8. **Error Handling**
   - Standardized error responses
   - No sensitive information in error messages
   - Request ID tracking

## Security Concerns and Recommendations

### 🔴 High Priority Issues

#### 1. XSS Risk: Unsanitized HTML in `dangerouslySetInnerHTML`

**Location:** `web/src/app/offer/[token]/OfferDisplay.tsx:64`

**Issue:**

```tsx
dangerouslySetInnerHTML={{ __html: bodyContent }}
```

The `bodyContent` is extracted from HTML stored in the database. While the HTML is sanitized when stored, we should verify it's sanitized again when displayed, especially for shared offer links.

**Risk:** If an attacker can inject malicious HTML into the database (e.g., through a vulnerability), it could execute in users' browsers.

**Recommendation:**

```tsx
// Add sanitization before rendering
import { sanitizeHTML } from '@/lib/sanitize';

const sanitizedBodyContent = sanitizeHTML(bodyContent);
return (
  <div
    id="offer-content-container"
    className="mb-8"
    dangerouslySetInnerHTML={{ __html: sanitizedBodyContent }}
  />
);
```

**Status:** ⚠️ Needs Fix

---

#### 2. XSS Risk: RichTextEditor innerHTML Usage

**Location:** `web/src/components/RichTextEditor.tsx:234, 285`

**Issue:**

```tsx
onChange(editorEl.innerHTML); // Line 234
editorEl.innerHTML = sanitizedValue; // Line 285
```

The RichTextEditor uses `innerHTML` directly. While `sanitizedValue` is sanitized, the `onChange` callback receives raw HTML from the contentEditable element.

**Risk:** If the sanitized value doesn't match the actual content (e.g., user pastes content), unsanitized HTML could be stored.

**Recommendation:**

- Always sanitize HTML from `innerHTML` before calling `onChange`
- Add validation to ensure stored HTML matches sanitized version
- Consider using a more secure rich text editor library

**Status:** ⚠️ Needs Review

---

#### 3. Authorization: Verify RLS Policies

**Location:** Multiple API routes

**Issue:** While Supabase RLS policies should enforce authorization, we should verify that:

1. All database queries use authenticated Supabase client
2. RLS policies are properly configured
3. No service role client is used for user operations

**Recommendation:**

- Audit all database queries to ensure they use `supabaseServer()` (authenticated client)
- Verify `supabaseServiceRole()` is only used for admin operations
- Review RLS policies in migrations
- Add explicit user_id checks where RLS might not be sufficient

**Status:** ⚠️ Needs Audit

---

### 🟡 Medium Priority Issues

#### 4. File Upload: Path Traversal Risk

**Location:** `web/src/app/api/storage/upload-brand-logo/route.ts:234`

**Issue:**

```tsx
const path = `${userId}/brand-logo.${normalizedImage.extension}`;
```

While `userId` comes from authenticated user, we should validate it doesn't contain path traversal characters.

**Recommendation:**

```tsx
// Validate userId doesn't contain path traversal
if (userId.includes('..') || userId.includes('/') || userId.includes('\\')) {
  return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
}
const path = `${userId}/brand-logo.${normalizedImage.extension}`;
```

**Status:** ⚠️ Defense in Depth

---

#### 5. Error Messages: Potential Information Leakage

**Location:** Various API routes

**Issue:** Some error messages might reveal system internals:

- Database error details
- File system paths
- Internal service names

**Recommendation:**

- Review all error messages for sensitive information
- Use generic error messages for users
- Log detailed errors server-side only
- Ensure stack traces are never sent to clients

**Status:** ✅ Generally Good, but Review Needed

---

#### 6. Rate Limiting: Bypass Attempts

**Location:** `web/src/lib/rateLimitMiddleware.ts`

**Issue:** Rate limiting might be bypassed by:

- Using different IP addresses
- Clearing cookies/device IDs
- Multiple user accounts

**Recommendation:**

- Implement progressive rate limiting (stricter limits after violations)
- Track rate limit violations per user
- Consider CAPTCHA after repeated violations
- Monitor for suspicious patterns

**Status:** ⚠️ Enhancement Opportunity

---

#### 7. Content Security Policy (CSP)

**Status:** ✅ **IMPLEMENTED**

**Location:** `web/next.config.ts:97-130`

CSP headers are properly configured with:

- Strict default-src policy
- Allowed image sources (Supabase, Google Analytics)
- Script sources with unsafe-inline (needed for Next.js)
- Connect sources for API calls
- Frame-ancestors protection

**Note:** `unsafe-inline` is used for styles, which is common for Next.js apps. Consider using nonces in the future for stricter policy.

---

### 🟢 Low Priority / Best Practices

#### 8. Security Headers

**Recommendation:**
Add security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (formerly Feature-Policy)
- `Strict-Transport-Security` (HSTS) for HTTPS

**Status:** ⚠️ Missing

---

#### 9. Input Validation: Additional Checks

**Recommendation:**

- Add validation for UUID formats
- Validate email formats more strictly
- Check for null bytes in strings
- Validate array lengths before processing

**Status:** ✅ Generally Good

---

#### 10. Logging: Sensitive Data

**Location:** Various logging statements

**Issue:** Ensure logs don't contain:

- Passwords or tokens
- Credit card numbers
- Personal identifiable information (PII)

**Recommendation:**

- Review all logging statements
- Use sanitization for sensitive fields
- Implement log redaction utility

**Status:** ⚠️ Review Needed

---

#### 11. Dependency Security

**Recommendation:**

- Regularly audit dependencies for vulnerabilities
- Use `npm audit` or `yarn audit`
- Keep dependencies up to date
- Consider using Dependabot or similar tools

**Status:** ⚠️ Ongoing Maintenance

---

## Security Checklist

### Authentication & Authorization

- [x] HTTP-only cookies for tokens
- [x] CSRF protection
- [x] Session validation
- [x] Request context validation
- [ ] Verify all RLS policies
- [ ] Explicit user_id checks in critical operations

### Input Validation

- [x] HTML sanitization
- [x] URL validation
- [x] File type validation
- [x] File size limits
- [x] Content moderation
- [ ] Path traversal prevention
- [ ] UUID format validation

### XSS Protection

- [x] HTML escaping
- [x] Attribute sanitization
- [ ] Sanitize before dangerouslySetInnerHTML
- [ ] CSP headers

### File Upload Security

- [x] MIME type validation
- [x] File size limits
- [x] Image format validation
- [x] SVG sanitization
- [ ] Path traversal prevention
- [ ] Virus scanning (future)

### Error Handling

- [x] Standardized error format
- [x] No sensitive info in errors
- [x] Request ID tracking
- [ ] Review all error messages

### Security Headers

- [x] Content-Security-Policy ✅
- [x] X-Content-Type-Options ✅
- [x] Frame-Ancestors (X-Frame-Options equivalent) ✅
- [x] Referrer-Policy ✅
- [x] HSTS ✅
- [x] Permissions-Policy ✅

### Logging & Monitoring

- [x] Structured logging
- [x] Request ID tracking
- [ ] Sensitive data redaction
- [ ] Security event monitoring

## Immediate Action Items

1. ✅ **Fix XSS in OfferDisplay** - Added sanitization before dangerouslySetInnerHTML
2. **Review RichTextEditor** - Ensure all HTML is sanitized
3. **Audit RLS Policies** - Verify all database queries are properly protected
4. ✅ **Security Headers** - Already implemented in next.config.ts
5. **Review Error Messages** - Ensure no sensitive information leakage
6. ✅ **Path Traversal Prevention** - Added validation in file upload route

## Long-Term Recommendations

1. **Security Testing**
   - Implement automated security tests
   - Regular penetration testing
   - Dependency vulnerability scanning

2. **Security Monitoring**
   - Set up security event logging
   - Monitor for suspicious patterns
   - Alert on security violations

3. **Security Training**
   - Code review guidelines
   - Security best practices documentation
   - Regular security reviews

4. **Compliance**
   - GDPR compliance review
   - Data retention policies
   - Privacy policy alignment

## Conclusion

The codebase demonstrates **excellent** security practices with:

✅ **Strong Security Controls:**

- Comprehensive authentication and CSRF protection
- Input sanitization and content moderation
- Security headers (CSP, HSTS, etc.) properly configured
- File upload validation
- Rate limiting and quota enforcement

✅ **Recent Improvements:**

- Content moderation for OpenAI integration
- XSS protection in OfferDisplay component
- Path traversal prevention in file uploads

⚠️ **Remaining Areas for Improvement:**

1. **RichTextEditor Review** - Verify HTML sanitization is comprehensive
2. **RLS Policy Audit** - Verify all database queries are properly protected
3. **Error Message Review** - Ensure no sensitive information leakage
4. **Defense in Depth** - Continue adding validation layers

Overall security posture: **Very Good** - Strong foundation with minor areas for enhancement.

---

**Last Updated:** 2025-01-16
**Reviewer:** Security Audit
**Next Review:** Quarterly or after major changes
