# PDF Generation on Vercel - Industry Best Practices

## Current Implementation Analysis

### Current Setup
- **Implementation**: Supabase Edge Functions with Puppeteer (Deno version)
- **Location**: `supabase/functions/pdf-worker/index.ts`
- **Architecture**: Vercel Next.js API → Supabase Edge Function → Puppeteer → PDF
- **Status**: ✅ Working but not optimal for Vercel

### Why This Works But Isn't Ideal
1. **Extra Infrastructure**: Requires Supabase Edge Functions deployment
2. **Network Latency**: Additional HTTP call to Supabase
3. **Complexity**: Two separate systems to maintain
4. **Cost**: Supabase Edge Function invocations add to costs

## Industry Best Practice for Vercel

### Recommended Approach: `puppeteer-core` + `@sparticuz/chromium`

**Why This is Best Practice:**
1. ✅ **Native Vercel Support**: Runs directly in Vercel serverless functions
2. ✅ **No External Dependencies**: Everything runs in your Vercel deployment
3. ✅ **Lower Latency**: No network calls to external services
4. ✅ **Simpler Architecture**: Single system to maintain
5. ✅ **Cost Effective**: Only Vercel function invocations
6. ✅ **Better Performance**: Direct execution, no network overhead

### Implementation Requirements

1. **Packages** (Already installed ✅):
   - `puppeteer-core`: Lightweight Puppeteer without bundled Chromium
   - `@sparticuz/chromium`: Optimized Chromium for serverless (AWS Lambda/Vercel)

2. **Configuration** (Needs to be added):
   - Configure `next.config.ts` to externalize these packages
   - Set up proper function configuration in `vercel.json`

3. **API Route**:
   - Create/update PDF generation API route in Next.js
   - Use `puppeteer-core` with `@sparticuz/chromium` executable path
   - Handle timeouts and memory limits appropriately

## Migration Plan

### Step 1: Update Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/auth-js'],
  },
  // Add server external packages for Puppeteer
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};
```

### Step 2: Create Vercel-Native PDF Generation Route

Create `src/app/api/pdf/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan: 60s, Enterprise: 300s

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    // Configure Chromium for serverless
    chromium.setGraphicsMode(false);
    const executablePath = await chromium.executablePath();

    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

### Step 3: Update Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "src/app/api/pdf/generate/route.ts": {
      "maxDuration": 60,
      "memory": 3008
    }
  }
}
```

### Step 4: Update Dependencies

Move packages from devDependencies to dependencies:

```json
{
  "dependencies": {
    "@sparticuz/chromium": "^141.0.0",
    "puppeteer-core": "^24.26.1"
  }
}
```

### Step 5: Migration Strategy

1. **Phase 1**: Implement new Vercel-native route alongside existing Supabase route
2. **Phase 2**: Test thoroughly with production-like data
3. **Phase 3**: Update API clients to use new endpoint
4. **Phase 4**: Deprecate Supabase Edge Function (keep as fallback)
5. **Phase 5**: Remove Supabase Edge Function after successful migration

## Comparison

| Aspect | Current (Supabase) | Best Practice (Vercel Native) |
|--------|-------------------|------------------------------|
| **Latency** | Higher (network call) | Lower (direct execution) |
| **Complexity** | Higher (2 systems) | Lower (1 system) |
| **Cost** | Vercel + Supabase | Vercel only |
| **Maintenance** | 2 deployments | 1 deployment |
| **Cold Starts** | 2 cold starts | 1 cold start |
| **Debugging** | More complex | Simpler |
| **Scaling** | Dependent on 2 services | Single service |

## CSS Compatibility

**Important**: The CSS fixes implemented for PDF generation are compatible with both approaches because:
- Both use Puppeteer/Chrome rendering engine
- CSS `@page` rules work the same way
- Page counters (`counter(page)`, `counter(pages)`) work identically
- Fixed headers/footers behave the same

## Recommendations

### Immediate Actions
1. ✅ Keep current implementation (it works)
2. ⚠️ Plan migration to Vercel-native approach
3. ✅ CSS fixes are valid for both approaches

### Short-term (1-2 weeks)
1. Implement Vercel-native PDF route
2. Test with production data
3. Compare performance and costs

### Long-term (1-2 months)
1. Migrate all PDF generation to Vercel-native
2. Deprecate Supabase Edge Function
3. Remove Supabase Edge Function after migration

## Alternative: Managed Services

If you prefer not to manage Puppeteer yourself, consider:

### Browserless.io
- **Pros**: Fully managed, scalable, no maintenance
- **Cons**: Additional cost (~$75-500/month), external dependency
- **Best for**: High volume, enterprise needs

### Playwright on Vercel
- **Pros**: Modern API, better browser support
- **Cons**: Larger bundle size, newer ecosystem
- **Best for**: Future-proofing, modern features

## Conclusion

**Current Status**: ✅ Working but suboptimal
**Recommended**: Migrate to Vercel-native `puppeteer-core` + `@sparticuz/chromium`
**Priority**: Medium (works now, but migration improves performance and reduces complexity)
**CSS Fixes**: ✅ Valid for both approaches (no changes needed)

