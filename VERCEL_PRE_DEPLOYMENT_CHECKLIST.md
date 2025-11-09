# Vercel Pre-Deployment Checklist

## ✅ Critical Items (Must Complete)

### 1. Environment Variables
- [ ] Set all required environment variables in Vercel Dashboard
- [ ] Set `EXTERNAL_API_SYSTEM_USER_ID` (optional but recommended)
- [ ] Verify `APP_URL` matches your Vercel deployment URL
- [ ] Verify `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` is correct
- [ ] Test environment variables in preview deployment first

### 2. System User for External API
- [ ] Create a system user in Supabase for external API PDF generation
- [ ] Set `EXTERNAL_API_SYSTEM_USER_ID` environment variable with the user's UUID
- [ ] Verify the system user has necessary permissions (or use service_role)

### 3. Supabase Configuration
- [ ] Verify Supabase Edge Function `pdf-worker` is deployed and working
- [ ] Verify Supabase Edge Function has access to required environment variables
- [ ] Test PDF generation via Supabase Edge Function directly
- [ ] Verify Supabase storage bucket `offers` exists and is configured correctly

### 4. Build Configuration
- [ ] Verify `vercel.json` is in the root of the `web` directory (or adjust root directory in Vercel)
- [ ] Test build locally: `npm run build`
- [ ] Verify no build errors or warnings
- [ ] Check build output size (should be reasonable)

## ⚠️ Recommended Items

### 5. Dependencies Optimization
- [ ] Consider moving `puppeteer` to `devDependencies` (optional - currently safe since it's not used in production routes)
- [ ] Verify `sharp` is working correctly (already optimized for Vercel)

### 6. Monitoring & Logging
- [ ] Set up Vercel Analytics (if on Pro plan)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up monitoring alerts for PDF generation failures
- [ ] Configure Vercel Log Streaming

### 7. Security
- [ ] Review and test security headers
- [ ] Verify CSP policies work correctly
- [ ] Test CSRF protection
- [ ] Verify rate limiting is working
- [ ] Test authentication flows

### 8. Performance
- [ ] Test API route response times
- [ ] Verify image optimization is working
- [ ] Test PDF generation end-to-end
- [ ] Monitor function execution times
- [ ] Check for cold start issues

## 📋 Testing Checklist

### Local Testing
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` (should pass)
- [ ] Run `npm test` (if applicable)
- [ ] Test all API routes locally
- [ ] Test PDF generation locally (via Supabase Edge Function)

### Preview Deployment Testing
- [ ] Deploy to Vercel preview environment
- [ ] Test authentication flows
- [ ] Test PDF generation via `/api/ai-generate`
- [ ] Test external API PDF generation via `/api/pdf/export`
- [ ] Test status polling endpoint
- [ ] Test download endpoint
- [ ] Verify no Puppeteer errors in logs
- [ ] Check error logs for any issues
- [ ] Test webhook callbacks (if used)

### Production Deployment Testing
- [ ] Deploy to production
- [ ] Test all critical user flows
- [ ] Monitor error rates
- [ ] Check function execution times
- [ ] Verify PDF generation is working
- [ ] Test rate limiting
- [ ] Verify security headers
- [ ] Test authentication flows

## 🔍 Verification Steps

### 1. Verify Puppeteer is Not Used in Production
```bash
# Check that no Puppeteer imports are used in API routes (except tests)
grep -r "import.*puppeteer" web/src/app/api --exclude-dir=__tests__
# Should only show comments, not actual imports
```

### 2. Verify Environment Variables
```bash
# Check that all required environment variables are set
# In Vercel Dashboard → Settings → Environment Variables
```

### 3. Verify Build Success
```bash
# Local build test
cd web
npm run build
# Should complete without errors
```

### 4. Verify Function Configuration
- Check `vercel.json` function timeout and memory settings
- Verify function paths match your API route structure
- Check region configuration

## 🚨 Known Issues & Workarounds

### 1. Puppeteer in Dependencies
**Status**: ✅ Safe (not used in production routes)
**Action**: Optional - can move to devDependencies later if desired
**Reason**: `pdfInlineWorker.ts` is only used as fallback and detects Vercel environment

### 2. Husky Prepare Script
**Status**: ✅ Safe (Vercel handles this gracefully)
**Action**: None required
**Reason**: Vercel skips git hooks during build

### 3. Build Scripts
**Status**: ✅ Safe
**Action**: None required
**Reason**: All build scripts are compatible with Vercel

## 📝 Documentation Updates Needed

- [ ] Update API documentation for external API users (migration from sync to async)
- [ ] Update deployment documentation
- [ ] Create runbook for common issues
- [ ] Document environment variable requirements
- [ ] Update README with Vercel deployment instructions

## 🎯 Post-Deployment Tasks

### Immediate (First 24 Hours)
- [ ] Monitor error logs
- [ ] Check function execution times
- [ ] Verify PDF generation is working
- [ ] Test all critical user flows
- [ ] Monitor API response times

### Short-term (First Week)
- [ ] Optimize based on metrics
- [ ] Tune function timeouts if needed
- [ ] Adjust memory allocation if needed
- [ ] Set up automated alerts
- [ ] Review and optimize slow endpoints

### Long-term (Ongoing)
- [ ] Monitor costs
- [ ] Optimize bundle size
- [ ] Review and update dependencies
- [ ] Performance optimization
- [ ] Security audits

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Vercel Functions](https://vercel.com/docs/functions)

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase Edge Function logs
3. Review error logs in Vercel dashboard
4. Check `VERCEL_DEPLOYMENT_REVIEW.md` for detailed information
5. Check `VERCEL_IMPLEMENTATION_GUIDE.md` for troubleshooting

