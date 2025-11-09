# Vercel Implementation Guide - Quick Reference

## Immediate Actions Required

### 1. Puppeteer Migration (Critical) ✅ COMPLETED

The `/api/pdf/export` route has been migrated to use Supabase Edge Functions instead of Puppeteer.

**Changes Made**:
- ✅ Migrated `/api/pdf/export` to use job queue system
- ✅ Created `pdfExternalApi.ts` helper for external API PDF jobs
- ✅ Added status endpoint: `/api/pdf/export/[jobId]/status`
- ✅ Added download endpoint: `/api/pdf/export/[jobId]/download`
- ✅ Updated inline PDF worker to skip on Vercel (detects `VERCEL` environment variable)
- ✅ Endpoint now returns job ID immediately (202 Accepted) and supports polling/webhooks

**New API Behavior**:
- POST `/api/pdf/export` returns job ID and status URLs immediately
- GET `/api/pdf/export/[jobId]/status` checks job status
- GET `/api/pdf/export/[jobId]/download` downloads completed PDF
- Webhook callbacks supported via `callbackUrl` parameter

### 2. Environment Variables Setup

Set the following in Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTH_COOKIE_SECRET=your-32-char-secret
CSRF_SECRET=your-32-char-secret
MAGIC_LINK_RATE_LIMIT_SALT=your-16-char-salt
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
APP_URL=https://your-domain.vercel.app
PUBLIC_CONTACT_EMAIL=hello@yourdomain.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI=https://your-project.supabase.co/auth/v1/callback
EXTERNAL_API_SYSTEM_USER_ID=uuid-of-system-user (optional, for external API PDF generation)
```

**Preview Environment:**
Use the same variables but with preview/staging values.

**Development Environment:**
Use local development values.

### 3. Vercel Configuration

The `vercel.json` file has been created with:
- Function timeout: 60 seconds (Pro plan)
- Memory: 1024 MB
- Region: `iad1` (US East)

**To customize:**
- Change `regions` to your preferred region(s)
- Adjust `maxDuration` based on your plan (10s Hobby, 60s Pro, 300s Enterprise)
- Adjust `memory` if needed (1024 MB default, up to 3008 MB on Pro)

### 4. Build Configuration

Verify your build settings in Vercel Dashboard:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Root Directory:** `web` (if deploying from monorepo root)

### 5. Domain Configuration

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update `APP_URL` environment variable to match
4. Update `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` if needed
5. Configure DNS records as instructed by Vercel

## Deployment Steps

### First Deployment

1. **Connect Repository**
   - Go to Vercel Dashboard → Add New Project
   - Import your Git repository
   - Select the `web` directory as root (if monorepo)

2. **Configure Environment Variables**
   - Add all required environment variables
   - Set different values for Production, Preview, and Development

3. **Deploy**
   - Click "Deploy"
   - Monitor build logs
   - Check for any build errors

4. **Verify Deployment**
   - Test all API routes
   - Verify authentication flows
   - Test PDF generation (via Supabase Edge Function)
   - Check error logs

### Subsequent Deployments

- Automatic deployments on push to main branch
- Preview deployments for pull requests
- Manual deployments via Vercel CLI: `vercel --prod`

## Testing Checklist

### Pre-Deployment Testing

- [ ] Build completes successfully: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `tsc --noEmit`
- [ ] Local development works: `npm run dev`

### Post-Deployment Testing

- [ ] Home page loads
- [ ] Authentication works (magic link)
- [ ] Google OAuth works (if configured)
- [ ] Dashboard loads
- [ ] Offer creation works
- [ ] PDF generation works (via Supabase Edge Function)
- [ ] Stripe checkout works
- [ ] API routes respond correctly
- [ ] Error pages work (404, 500)
- [ ] Security headers are present
- [ ] CSP policies are working

## Monitoring Setup

### Vercel Analytics

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics (if on Pro plan)
3. Enable Speed Insights
4. Monitor Core Web Vitals

### Error Tracking

1. Set up Sentry or similar service
2. Configure error boundaries
3. Monitor API route errors
4. Set up alerts for critical errors

### Logging

1. Use Vercel's built-in logging
2. Monitor function execution times
3. Track API route performance
4. Set up alerts for slow functions

## Troubleshooting

### Build Failures

**Issue:** Build fails with memory error
**Solution:** Increase memory in `vercel.json` or optimize build process

**Issue:** Build fails with timeout
**Solution:** Increase build timeout or optimize dependencies

**Issue:** TypeScript errors
**Solution:** Fix TypeScript errors locally before deploying

### Runtime Errors

**Issue:** Function timeout
**Solution:** 
- Check function execution time
- Optimize slow operations
- Increase `maxDuration` in `vercel.json`
- Consider moving to Supabase Edge Functions

**Issue:** Memory limit exceeded
**Solution:** 
- Optimize memory usage
- Increase memory allocation
- Move heavy operations to Supabase Edge Functions

**Issue:** Puppeteer errors
**Solution:** 
- Remove Puppeteer from Next.js routes
- Use Supabase Edge Functions for PDF generation
- Or use `@sparticuz/chromium` with proper configuration

### Environment Variable Issues

**Issue:** Environment variables not available
**Solution:** 
- Check variable names (case-sensitive)
- Verify environment (Production/Preview/Development)
- Restart deployment after adding variables

**Issue:** `NEXT_PUBLIC_*` variables not working
**Solution:** 
- Ensure variables are set in Vercel Dashboard
- Redeploy after adding variables
- Check variable names match exactly

## Performance Optimization

### Function Optimization

1. **Reduce Cold Starts**
   - Use edge runtime where possible
   - Optimize dependencies
   - Reduce bundle size

2. **Optimize Execution Time**
   - Cache expensive operations
   - Use database connection pooling
   - Optimize database queries

3. **Reduce Memory Usage**
   - Optimize data structures
   - Stream large responses
   - Clean up resources promptly

### Caching Strategy

1. **Static Assets**
   - Use Next.js Image Optimization
   - Enable CDN caching
   - Set appropriate cache headers

2. **API Routes**
   - Implement caching where appropriate
   - Use `revalidate` for ISR
   - Set cache headers

3. **Database Queries**
   - Use Supabase connection pooling
   - Implement query caching
   - Optimize query performance

## Security Checklist

- [ ] Security headers are configured
- [ ] CSP policies are working
- [ ] CSRF protection is enabled
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] SQL injection protection (via Supabase)
- [ ] XSS protection is enabled
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] API keys are not exposed

## Cost Optimization

### Vercel Pricing

- **Hobby:** Free (10s function timeout, 100GB bandwidth)
- **Pro:** $20/month (60s function timeout, 1TB bandwidth)
- **Enterprise:** Custom pricing

### Optimization Tips

1. **Reduce Function Execution Time**
   - Optimize code
   - Use caching
   - Move heavy operations to Supabase

2. **Reduce Bandwidth**
   - Optimize images
   - Use CDN caching
   - Compress responses

3. **Monitor Usage**
   - Track function invocations
   - Monitor bandwidth usage
   - Set up usage alerts

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)

## Support

If you encounter issues:
1. Check Vercel Dashboard logs
2. Review error messages
3. Check Vercel documentation
4. Contact Vercel support (if on Pro/Enterprise)
5. Review this guide and the main review document

