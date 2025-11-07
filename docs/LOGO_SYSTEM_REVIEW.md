# Logo System Review

## Overview

This document provides a comprehensive review of the logo upload, storage, and usage system in the AI Offer application.

## Architecture

### 1. Upload Flow (`/api/storage/upload-brand-logo`)

**Location**: `web/src/app/api/storage/upload-brand-logo/route.ts`

**Process**:
1. User uploads file via Settings page (`web/src/app/settings/page.tsx`)
2. File validation:
   - Max size: 4MB
   - Allowed types: PNG, JPEG, SVG
   - Content validation via binary signatures
3. Image processing:
   - **PNG**: Compressed with Sharp (compression level 9)
   - **JPEG**: Optimized with Sharp (quality 90, mozjpeg)
   - **SVG**: Sanitized using `sanitizeSvgMarkup()` to remove dangerous elements
4. Storage:
   - Bucket: `brand-assets` (private)
   - Path: `${userId}/brand-logo.{extension}`
   - Upsert enabled (overwrites existing)
5. Response:
   - Creates signed URL with 1-hour TTL
   - Returns `{ signedUrl: "..." }`
6. Client-side:
   - Stores signed URL in `profiles.brand_logo_url` field
   - Updates local state immediately

### 2. Storage Configuration

**Bucket**: `brand-assets`
- **Public**: `false` (private bucket)
- **File size limit**: 4MB
- **Allowed MIME types**: `['image/png', 'image/jpeg', 'image/svg+xml']`

**Storage Policies** (from `20250522120000_profiles_branding_access.sql`):
- Users can only read/insert/update/delete their own files
- Policies check `auth.uid() = owner`
- Properly secured against cross-tenant access

### 3. Database Schema

**Table**: `profiles`
- Column: `brand_logo_url` (TEXT, nullable)
- Stores: Signed URL string (currently)

### 4. Usage in PDF Generation

**Flow**:
1. Logo URL retrieved from `profiles.brand_logo_url`
2. URL sanitized via `sanitizeBrandLogoUrl()` (validates HTTPS/HTTP protocol)
3. Passed to PDF templates via `buildHeaderFooterCtx()` or `offerBodyMarkup()`
4. Rendered in HTML as `<img src="${logoUrl}" alt="..." />`
5. PDF generated via Puppeteer (loads image from URL)

**Templates using logos**:
- `free.base` - `renderBrand()` function
- `pro.nordic` - `renderBrandIdentity()` function
- `premium.modern` - Header partial
- `premium.elegant` - Header partial
- `premium-banner` - Premium banner variant

**Fallback**: If no logo URL, templates show monogram (derived from company name initials)

## Critical Issues

### 🔴 CRITICAL: Signed URL Expiration Problem

**Problem**: 
- Signed URLs expire after **1 hour** (`SIGNED_URL_TTL_SECONDS = 60 * 60`)
- Logo URLs stored in database become **invalid after 1 hour**
- PDFs generated later will have **broken logo images**

**Impact**:
- User uploads logo → Works in preview/UI
- User generates PDF 2+ hours later → Logo missing/broken
- Existing PDFs in database may have expired logo URLs

**Current Code**:
```typescript
// upload-brand-logo/route.ts:219-229
const { data: signedData, error: signedError } = await sb.storage
  .from(BUCKET_ID)
  .createSignedUrl(path, SIGNED_URL_TTL_SECONDS); // 1 hour TTL
return NextResponse.json({ signedUrl: signedData.signedUrl });

// settings/page.tsx:652
setProfile((prev) => ({ ...prev, brand_logo_url: logoUrl })); // Stores expired URL
```

**Recommended Solutions**:

**Option 1: Store Storage Path Instead of URL** (Recommended)
- Store: `{userId}/brand-logo.{extension}` in database
- Generate signed URL on-demand when needed:
  - Before PDF generation
  - In BrandingProvider when loading UI
  - In preview/preview endpoints

**Option 2: Long-lived Signed URLs**
- Generate signed URLs with longer TTL (e.g., 365 days)
- Still requires refresh mechanism eventually

**Option 3: Refresh on PDF Generation**
- Check if URL is expired before PDF generation
- Generate fresh signed URL if needed
- Update database with new URL

**Option 4: Use Public URL** (Not recommended)
- Would require making bucket public
- Loses security benefits of private bucket

### ⚠️ Security Concerns

**Good Practices**:
- ✅ SVG sanitization (removes scripts, foreignObject, etc.)
- ✅ Binary signature validation (prevents MIME type spoofing)
- ✅ File size limits (4MB)
- ✅ User-scoped storage policies
- ✅ Private bucket

**Potential Issues**:
- ⚠️ No rate limiting on storage operations (only on upload endpoint)
- ⚠️ No file content scanning (malware detection)
- ⚠️ SVG sanitization may be incomplete (should audit)

### ⚠️ Performance & Scalability

**Good Practices**:
- ✅ Image optimization (Sharp compression)
- ✅ Upsert pattern (overwrites old logo)
- ✅ Rate limiting on upload endpoint (10 requests/minute)

**Potential Issues**:
- ⚠️ No CDN caching (images served directly from Supabase)
- ⚠️ Signed URL generation on every request (if fixed)
- ⚠️ No image resizing/thumbnails (might need for future)

## Recommendations

### Priority 1: Fix Signed URL Expiration

**Immediate Action Required**:

1. **Change database schema** to store storage path instead of URL:
   ```sql
   -- Migration: Change brand_logo_url to store path
   -- Format: {userId}/brand-logo.{extension}
   ```

2. **Create utility function** to generate signed URLs on-demand:
   ```typescript
   // lib/branding.ts
   export async function getBrandLogoUrl(
     supabase: SupabaseClient,
     userId: string,
     logoPath: string | null
   ): Promise<string | null> {
     if (!logoPath) return null;
     
     const { data, error } = await supabase.storage
       .from('brand-assets')
       .createSignedUrl(logoPath, 3600); // 1 hour for PDF generation
     
     return data?.signedUrl ?? null;
   }
   ```

3. **Update all retrieval points**:
   - `BrandingProvider.tsx` - Generate URL when loading
   - `offerDocument.ts` - Generate URL before PDF render
   - `ai-generate/route.ts` - Generate URL before queuing PDF
   - `new/page.tsx` - Generate URL for preview

4. **Migration script** to convert existing URLs to paths:
   - Extract path from existing signed URLs
   - Or re-upload logos if path extraction fails

### Priority 2: Improve Error Handling

- Add fallback when signed URL generation fails
- Log errors for monitoring
- Show user-friendly error messages

### Priority 3: Add Caching Layer

- Cache signed URLs in memory/Redis (with TTL)
- Reduce storage API calls
- Improve performance

### Priority 4: Consider CDN Integration

- Use Supabase CDN or external CDN
- Cache logos at edge locations
- Improve global performance

## Code Locations

### Upload
- `web/src/app/api/storage/upload-brand-logo/route.ts` - Upload endpoint
- `web/src/app/api/storage/ensure-brand-bucket/route.ts` - Bucket setup
- `web/src/app/settings/page.tsx` - Upload UI (lines 614-670)

### Storage
- `web/supabase/migrations/20250215000000_profiles_branding.sql` - Schema
- `web/supabase/migrations/20250522120000_profiles_branding_access.sql` - Policies
- `web/supabase/docs/brand-assets-policy.md` - Policy documentation

### Usage
- `web/src/lib/branding.ts` - Logo URL sanitization
- `web/src/components/BrandingProvider.tsx` - Logo loading for UI
- `web/src/app/pdf/templates/shared/headerFooter.ts` - PDF template helpers
- `web/src/app/lib/offerDocument.ts` - PDF document builder

### Validation
- `web/src/lib/sanitizeSvg.ts` - SVG sanitization

## Testing

### Test Cases Needed

1. **Upload Flow**:
   - ✅ File size validation
   - ✅ File type validation
   - ✅ Image processing
   - ✅ SVG sanitization
   - ✅ Storage persistence

2. **URL Expiration** (Currently Missing):
   - ⚠️ Generate PDF 2+ hours after upload
   - ⚠️ Verify logo appears correctly
   - ⚠️ Test URL refresh mechanism

3. **Security**:
   - ✅ Cross-tenant access prevention
   - ✅ Malicious SVG handling
   - ✅ File type spoofing prevention

4. **Error Handling**:
   - ⚠️ Storage unavailable
   - ⚠️ Invalid file format
   - ⚠️ Signed URL generation failure

## Migration Plan

### Phase 1: Database Migration
1. Add new column: `brand_logo_path` (TEXT, nullable)
2. Keep `brand_logo_url` for backward compatibility
3. Write migration script to extract paths from URLs

### Phase 2: Update Upload Flow
1. Modify upload endpoint to return path instead of URL
2. Update Settings page to store path
3. Generate signed URL only for immediate preview

### Phase 3: Update Retrieval Points
1. Add utility function for signed URL generation
2. Update all PDF generation paths
3. Update BrandingProvider
4. Update preview endpoints

### Phase 4: Cleanup
1. Remove `brand_logo_url` column after migration period
2. Update tests
3. Update documentation

## Conclusion

The logo system is well-architected with good security practices, but has a **critical flaw** in storing expired signed URLs. This must be addressed immediately to prevent broken logos in PDFs generated after the 1-hour expiration window.

The recommended fix is to store storage paths instead of URLs and generate signed URLs on-demand when needed. This provides better security, reliability, and user experience.








