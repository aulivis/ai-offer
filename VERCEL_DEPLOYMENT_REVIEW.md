# Vercel Deployment Review - November 2025

## Executive Summary

This document reviews the codebase against Vercel's latest best practices (November 2025) and identifies required changes for optimal deployment. The application is a Next.js 15.5.6 application with React 19, using Supabase for backend services and Puppeteer for PDF generation.

## Critical Issues

### 1. Puppeteer in Serverless Functions ⚠️ **CRITICAL**

**Issue**: The codebase uses Puppeteer directly in Next.js API routes (`/api/pdf/export/route.ts` and `pdfInlineWorker.ts`), which is problematic on Vercel's serverless functions.

**Problems**:
- Puppeteer requires a full Chromium binary (~170MB), which exceeds Vercel's function size limits
- Cold start times are extremely slow (30+ seconds)
- Memory consumption is high (can exceed 512MB limit)
- Function timeout limits (10s Hobby, 60s Pro) may be exceeded
- Puppeteer may not work reliably in Vercel's serverless environment

**Current Implementation**:
- `/api/pdf/export/route.ts` - Uses Puppeteer directly
- `src/lib/pdfInlineWorker.ts` - Uses Puppeteer for inline PDF generation
- `supabase/functions/pdf-worker/index.ts` - Uses Puppeteer in Deno (Supabase Edge Function)

**Recommended Solutions**:

#### Option A: Use Supabase Edge Functions Only (Recommended)
- Remove Puppeteer from Next.js API routes
- Route all PDF generation to the existing Supabase Edge Function
- The Edge Function already handles PDF generation correctly

#### Option B: Use @sparticuz/chromium for Vercel
- Replace `puppeteer` with `puppeteer-core` + `@sparticuz/chromium`
- Configure for serverless environment
- Add to `next.config.ts`:
```typescript
serverComponentsExternalPackages: ['puppeteer-core'],
```
- Update Puppeteer launch configuration

#### Option C: Use Vercel's Edge Functions with Alternative PDF Library
- Consider using libraries like `@react-pdf/renderer` or `pdfkit` for simpler PDFs
- Move complex rendering to edge functions if needed

**Action Required**: 
- ✅ Already using Supabase Edge Function for PDF generation
- ⚠️ Remove or migrate Puppeteer usage from Next.js API routes
- ⚠️ Ensure all PDF generation goes through Supabase Edge Function

### 2. Function Timeout Limits ⚠️

**Issue**: PDF generation can take 30+ seconds, which may exceed Vercel's function timeout limits.

**Vercel Limits**:
- Hobby: 10 seconds
- Pro: 60 seconds
- Enterprise: 300 seconds (5 minutes)

**Current Implementation**:
- PDF generation uses 30-second timeouts
- Supabase Edge Function has 90-second timeout

**Recommendation**:
- Use Supabase Edge Functions for all PDF generation (already implemented)
- Ensure API routes that trigger PDF generation return immediately and poll for completion
- Implement webhook callbacks for PDF completion notifications

### 3. Memory Limits ⚠️

**Issue**: Puppeteer can consume 300-500MB+ of memory, which may exceed Vercel's limits.

**Vercel Limits**:
- Hobby: 1024 MB
- Pro: 1024 MB (configurable up to 3008 MB)
- Enterprise: Configurable

**Recommendation**:
- Move PDF generation to Supabase Edge Functions (already done)
- Monitor memory usage in production
- Consider increasing memory allocation if needed on Pro/Enterprise plans

## Configuration Issues

### 4. Missing Vercel Configuration File

**Issue**: No `vercel.json` file exists for project-specific configurations.

**Recommendations**:
Create `vercel.json` with optimal settings:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Note**: Security headers are already configured in `next.config.ts`, so `vercel.json` headers are optional.

### 5. Build Configuration

**Current Status**: ✅ Good
- `next.config.ts` is properly configured
- Security headers are set
- Image optimization is configured
- CSP is implemented

**Recommendations**:
- Consider adding `output: 'standalone'` for better Docker compatibility (if needed)
- Ensure `experimental.optimizePackageImports` is used (already implemented)

### 6. Environment Variables

**Current Status**: ✅ Excellent
- Well-structured environment variable validation
- Separate client/server environment files
- Zod schemas for type safety
- Production validation

**Vercel Configuration**:
- All environment variables from `env.server.ts` and `env.client.ts` must be set in Vercel dashboard
- Ensure `NEXT_PUBLIC_*` variables are set correctly
- Use Vercel's environment variable management for different environments

**Required Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_COOKIE_SECRET (min 32 chars)
CSRF_SECRET (min 32 chars)
MAGIC_LINK_RATE_LIMIT_SALT (min 16 chars)
OPENAI_API_KEY
STRIPE_SECRET_KEY
APP_URL
PUBLIC_CONTACT_EMAIL
SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI
```

**Optional Environment Variables**:
```
STRIPE_PRICE_ALLOWLIST
OAUTH_REDIRECT_ALLOWLIST
PDF_WEBHOOK_ALLOWLIST
NEXT_PUBLIC_STRIPE_PRICE_STARTER
NEXT_PUBLIC_STRIPE_PRICE_PRO
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_ENABLE_CHATBOT
```

## Runtime Configuration

### 7. API Route Runtime

**Current Status**: ✅ Correct
- All API routes explicitly set `export const runtime = 'nodejs'`
- This is appropriate for routes using Node.js APIs

**Routes Using Node.js Runtime**:
- `/api/chat/route.ts`
- `/api/ai-generate/route.ts`
- `/api/chat/analytics/route.ts`
- `/api/chat/feedback/route.ts`
- `/api/pdf/export/route.ts` ⚠️ (should use Supabase Edge Function instead)
- `/api/pdf/[jobId]/route.ts`
- `/api/offer-preview/render/route.ts`

**Recommendation**:
- Keep `nodejs` runtime for routes that need Node.js APIs
- Consider edge runtime for simple routes that don't need Node.js APIs
- Remove Puppeteer from `/api/pdf/export/route.ts` or migrate to Supabase Edge Function

### 8. Edge Runtime Opportunities

**Potential Edge Runtime Routes**:
- `/api/health/route.ts` - Simple health check
- `/api/templates/route.ts` - Static template listing
- `/api/auth/session/route.ts` - Session validation

**Benefits**:
- Lower latency
- Reduced cold start times
- Better global distribution

**Note**: Edge runtime has limitations (no Node.js APIs, smaller size limits), so evaluate carefully.

## Dependencies

### 9. Package Dependencies

**Current Status**: ✅ Good
- Next.js 15.5.6 (latest stable)
- React 19.1.0 (latest)
- TypeScript 5 (latest)
- All dependencies are up-to-date

**Vercel-Compatible Packages**:
- ✅ `sharp` - Optimized for Vercel
- ✅ `@supabase/supabase-js` - Works on Vercel
- ⚠️ `puppeteer` - Should be removed from Next.js routes
- ✅ `@sparticuz/chromium` - Already in devDependencies (for potential use)

**Recommendations**:
- Remove `puppeteer` from dependencies if not needed in Next.js routes
- Keep `puppeteer-core` and `@sparticuz/chromium` if planning to use Option B above
- Ensure all dependencies are compatible with serverless environment

### 10. Sharp Configuration

**Current Status**: ✅ Good
- Sharp is already included and optimized for Vercel
- No additional configuration needed

## Deployment Checklist

### Pre-Deployment

- [ ] Remove Puppeteer from Next.js API routes or migrate to Supabase Edge Function
- [ ] Create `vercel.json` with appropriate function configurations
- [ ] Set all required environment variables in Vercel dashboard
- [ ] Configure custom domain (if applicable)
- [ ] Set up Vercel Analytics (optional)
- [ ] Configure Vercel Logging
- [ ] Set up error monitoring (Sentry, etc.)

### Environment Variables

- [ ] Set all `NEXT_PUBLIC_*` variables in Vercel
- [ ] Set all server-side variables in Vercel
- [ ] Configure different values for Production, Preview, and Development
- [ ] Verify `APP_URL` is set correctly for each environment
- [ ] Ensure `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` matches Vercel URL

### Build Configuration

- [ ] Verify build command: `npm run build`
- [ ] Ensure build completes successfully
- [ ] Check for build warnings/errors
- [ ] Verify output size is within limits
- [ ] Test build locally before deploying

### Post-Deployment

- [ ] Verify all API routes are working
- [ ] Test PDF generation (via Supabase Edge Function)
- [ ] Verify authentication flows
- [ ] Test Stripe integration
- [ ] Monitor function execution times
- [ ] Check error logs
- [ ] Verify security headers are applied
- [ ] Test CSP policies
- [ ] Verify image optimization
- [ ] Test rate limiting

## Vercel-Specific Optimizations

### 11. Image Optimization

**Current Status**: ✅ Good
- Next.js Image component is used
- Remote patterns are configured for Supabase
- Sharp is available for optimization

**Recommendations**:
- Consider using Vercel's Image Optimization API
- Ensure images are served from CDN
- Optimize image sizes before upload

### 12. Caching Strategy

**Recommendations**:
- Implement ISR (Incremental Static Regeneration) where appropriate
- Use `revalidate` for dynamic content
- Configure cache headers for API routes
- Use Vercel's Edge Cache for static assets

### 13. Monitoring and Logging

**Recommendations**:
- Enable Vercel Analytics
- Set up Vercel Logging
- Configure error tracking (Sentry, etc.)
- Monitor function execution times
- Track API route performance
- Set up alerts for errors

### 14. Security

**Current Status**: ✅ Excellent
- Security headers are configured
- CSP is implemented
- CSRF protection is in place
- Input validation with Zod
- HTML sanitization
- Rate limiting

**Vercel-Specific Security**:
- Enable Vercel's DDoS protection
- Configure WAF (Web Application Firewall) if available
- Use Vercel's bot protection
- Enable deployment protection
- Configure RBAC (Role-Based Access Control)

## Migration Plan

### Phase 1: Immediate Fixes (Critical)

1. **Remove Puppeteer from Next.js Routes**
   - Remove `/api/pdf/export/route.ts` or migrate to Supabase Edge Function
   - Update `pdfInlineWorker.ts` to use Supabase Edge Function
   - Test PDF generation end-to-end

2. **Create Vercel Configuration**
   - Create `vercel.json` with function configurations
   - Set appropriate timeout and memory limits
   - Configure regions

3. **Environment Variables**
   - Set all required variables in Vercel dashboard
   - Test in preview environment first
   - Verify production environment variables

### Phase 2: Optimizations (High Priority)

1. **Function Optimization**
   - Review API routes for optimization opportunities
   - Consider edge runtime for simple routes
   - Optimize database queries
   - Implement caching where appropriate

2. **Monitoring Setup**
   - Enable Vercel Analytics
   - Set up error tracking
   - Configure logging
   - Set up alerts

### Phase 3: Advanced Features (Optional)

1. **Edge Functions**
   - Migrate simple routes to edge runtime
   - Optimize for global distribution
   - Reduce latency

2. **Performance Optimization**
   - Implement ISR where appropriate
   - Optimize bundle size
   - Implement code splitting
   - Optimize images

## Implementation Status

### ✅ Completed

1. **Puppeteer Migration**:
   - ✅ Migrated `/api/pdf/export` to use Supabase Edge Functions
   - ✅ Created `pdfExternalApi.ts` helper for external API PDF jobs
   - ✅ Added status and download endpoints for external API
   - ✅ Updated inline PDF worker to skip on Vercel (Puppeteer incompatible)
   - ✅ Created `vercel.json` configuration file

2. **Configuration**:
   - ✅ Created `vercel.json` with function timeout and memory settings
   - ✅ Added `EXTERNAL_API_SYSTEM_USER_ID` environment variable support
   - ✅ Updated environment variable documentation

3. **Documentation**:
   - ✅ Created comprehensive deployment review document
   - ✅ Created implementation guide
   - ✅ Updated API documentation

## Recommended Next Steps

1. **Immediate Actions**:
   - ✅ Create `vercel.json` configuration file (DONE)
   - ✅ Remove or migrate Puppeteer usage from Next.js routes (DONE)
   - Set up environment variables in Vercel dashboard
   - Create system user for external API calls (set `EXTERNAL_API_SYSTEM_USER_ID`)
   - Test deployment in preview environment

2. **Testing**:
   - Test all API routes
   - Verify PDF generation works correctly
   - Test authentication flows
   - Verify Stripe integration
   - Test rate limiting

3. **Monitoring**:
   - Set up Vercel Analytics
   - Configure error tracking
   - Monitor function execution times
   - Set up alerts

4. **Documentation**:
   - Document deployment process
   - Create runbook for common issues
   - Document environment variable requirements
   - Create troubleshooting guide

## References

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Deployment Best Practices](https://vercel.com/docs/deployments/overview)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel MCP (Model Control Protocol)](https://vercel.com/blog/introducing-vercel-mcp-connect-vercel-to-your-ai-tools)
- [Vercel TypeScript SDK](https://vercel.com/changelog/introducing-the-vercel-typescript-sdk)

## Conclusion

The codebase is generally well-structured for Vercel deployment, but there are critical issues with Puppeteer usage in Next.js API routes that must be addressed. The application already uses Supabase Edge Functions for PDF generation, which is the recommended approach. The main actions required are:

1. Remove Puppeteer from Next.js API routes
2. Create `vercel.json` configuration
3. Set up environment variables in Vercel
4. Test deployment thoroughly

With these changes, the application should deploy successfully on Vercel with optimal performance and reliability.

