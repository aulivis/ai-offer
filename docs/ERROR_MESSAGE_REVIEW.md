# Error Message Security Review

## Overview

This document reviews error messages returned to users to ensure no sensitive information is leaked.

## Security Principles

1. **Generic Error Messages:** User-facing errors should be generic and not reveal system internals
2. **Detailed Logging:** Detailed error information should only be logged server-side
3. **No Stack Traces:** Never expose stack traces to users
4. **No Paths/URLs:** Don't expose file paths, internal URLs, or system paths
5. **No Database Details:** Don't expose database errors, table names, or query details
6. **No API Keys/Tokens:** Never expose API keys, tokens, or secrets

## Review Results

### ✅ Good Practices Found

#### Standardized Error Handling

**Location:** `web/src/lib/errorHandling.ts`

- ✅ Uses generic error messages: `'Váratlan hiba történt.'`
- ✅ No stack traces in user responses
- ✅ Request IDs for tracking (not sensitive)
- ✅ Detailed errors logged server-side only

#### Error Response Format

```typescript
{
  error: "User-friendly message",
  requestId: "uuid",  // Safe - just for tracking
  issues?: {}  // Validation errors only
}
```

### ✅ API Route Error Messages

#### Authentication Errors

- ✅ `'A bejelentkezés lejárt vagy érvénytelen.'` - Generic, no details
- ✅ `'Érvénytelen vagy hiányzó CSRF token.'` - Generic, no details
- ✅ `'A kérés forrása nincs engedélyezve.'` - Generic, no details

#### Validation Errors

- ✅ `'Érvénytelen kérés.'` - Generic
- ✅ Field-level validation errors (safe - user input feedback)

#### Database Errors

- ✅ `'Váratlan hiba történt.'` - Generic, no database details
- ✅ Supabase errors mapped to generic messages
- ✅ Error codes mapped to HTTP status codes (no DB details exposed)

#### AI/OpenAI Errors

- ✅ `'OpenAI API hiba történt. Próbáld újra később.'` - Generic
- ✅ `'Az OpenAI API kulcs érvénytelen vagy nincs engedélyezve.'` - Appropriate (doesn't expose key)
- ✅ Detailed errors logged server-side only

#### File Upload Errors

- ✅ `'A fájl mérete legfeljebb 4 MB lehet.'` - Generic
- ✅ `'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.'` - Generic
- ✅ No file path exposure

### ⚠️ Areas Requiring Attention

#### 1. Error Context in Logging

**Status:** ✅ **GOOD** - Logger already sanitizes sensitive data

The logger (`web/src/lib/logger.ts`) uses `sanitizeLogObject` and `sanitizeError` which:

- Redacts passwords, tokens, API keys
- Sanitizes error messages
- Removes stack traces in production

**Recommendation:** ✅ Already implemented correctly

#### 2. Error Details in Development

**Status:** ⚠️ **REVIEW NEEDED**

Some error handlers include more details in development mode. This is acceptable but should be verified:

```typescript
// In errorHandling.ts
stack: process.env.NODE_ENV === 'production' ? undefined : sanitizedError.stack,
```

**Recommendation:** ✅ Acceptable - stack traces only in development, and they're sanitized

#### 3. Request Context in Error Responses

**Status:** ✅ **GOOD**

Error handlers extract request context but only for server-side logging:

```typescript
const context = {
  method: req.method,
  url: req.url,
  headers: Object.fromEntries(req.headers.entries()),
};
```

**Recommendation:** ✅ Good - context only used for logging, not in user responses

### Recommendations

#### High Priority

1. ✅ **Already Implemented:** Error sanitization in logger
2. ✅ **Already Implemented:** Generic error messages
3. ✅ **Already Implemented:** No stack traces in production

#### Medium Priority

4. **Review Error Messages:** Periodically review error messages for:
   - Accidental information leakage
   - Overly specific error messages
   - System internals exposure

5. **Error Message Testing:** Test error scenarios to ensure:
   - No sensitive data in responses
   - Generic messages are user-friendly
   - Request IDs are properly included

#### Low Priority

6. **Error Message Documentation:** Document all error messages and their triggers
7. **Error Message Localization:** Ensure error messages are properly localized

## Error Message Examples

### ✅ Good Error Messages

```typescript
// Generic, user-friendly
'Váratlan hiba történt.';
'Érvénytelen kérés.';
'A bejelentkezés lejárt vagy érvénytelen.';
```

### ❌ Bad Error Messages (Not Found)

```typescript
// These patterns are NOT found in the codebase:
'Database connection failed: postgresql://...';
'Error in query: SELECT * FROM users WHERE...';
'API key invalid: sk-1234567890abcdef';
'File not found: /var/www/app/data/user-123/file.pdf';
```

## Conclusion

**Overall Assessment:** ✅ **Excellent**

The codebase follows security best practices for error handling:

- Generic user-facing error messages
- Detailed errors logged server-side only
- Automatic sanitization of sensitive data
- No stack traces in production
- No system internals exposed

**Action Items:**

1. ✅ Continue using standardized error handling
2. ✅ Periodically review new error messages
3. ✅ Monitor error logs for accidental information leakage

---

**Last Updated:** 2025-01-16
**Next Review:** After adding new error handling code



