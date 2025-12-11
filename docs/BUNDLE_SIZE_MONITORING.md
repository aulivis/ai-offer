# Bundle Size Monitoring Guide

This document outlines the bundle size monitoring strategy and best practices for optimizing the application's bundle size.

## Overview

Bundle size directly impacts:

- **Initial load time**: Larger bundles take longer to download and parse
- **Time to Interactive (TTI)**: More JavaScript means longer execution time
- **Mobile performance**: Limited bandwidth and processing power on mobile devices
- **SEO**: Page speed is a ranking factor

## Bundle Analysis Tools

### @next/bundle-analyzer

We use `@next/bundle-analyzer` to visualize bundle composition and identify optimization opportunities.

#### Running Bundle Analysis

```bash
# Run bundle analysis (generates HTML reports)
pnpm analyze

# Or use the analysis script
pnpm analyze:bundle
```

#### Viewing Results

After running the analysis, open the generated HTML files:

- **Client bundle**: `.next/analyze/client.html`
- **Server bundle**: `.next/analyze/server.html`

These interactive visualizations show:

- Size of each chunk
- Dependencies and their sizes
- Duplicate dependencies
- Opportunities for code splitting

### Periodic Monitoring

**Recommended frequency**: Run bundle analysis:

- Before major releases
- After adding new dependencies
- Monthly as part of maintenance
- When performance issues are reported

## Dynamic Imports Strategy

### When to Use Dynamic Imports

Use dynamic imports for:

1. **Below-the-fold components**: Components not immediately visible
2. **Heavy third-party libraries**: Large dependencies used conditionally
3. **Dev-only tools**: Development tools like ReactQueryDevtools
4. **Route-based code splitting**: Components specific to certain routes
5. **Conditional features**: Features that may not always be needed

### Implementation Examples

#### Component Dynamic Import

```tsx
import dynamic from 'next/dynamic';

// Basic dynamic import
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'));

// With loading state
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR if component is client-only
});
```

#### Library Dynamic Import

```tsx
// For heavy libraries used conditionally
const loadHeavyLibrary = async () => {
  const { default: HeavyLibrary } = await import('heavy-library');
  return HeavyLibrary;
};

// Use when needed
const handleAction = async () => {
  const Library = await loadHeavyLibrary();
  Library.doSomething();
};
```

### Current Optimizations

The following components are already using dynamic imports:

- **ReactQueryDevtools**: Dev-only tool, dynamically imported
- **SwaggerUI**: Large library, dynamically imported with SSR disabled
- **Landing page components**: Below-the-fold sections (ComparisonTable, ROICalculatorLanding, TestimonialSection, etc.)
- **Dashboard components**: Route-specific components (OfferListItem, OffersCardGrid)
- **RichTextEditor**: Heavy editor component, dynamically imported

## Best Practices

### 1. Monitor Bundle Size Regularly

```bash
# Add to CI/CD pipeline
pnpm analyze:bundle
```

### 2. Set Bundle Size Budgets

Consider setting bundle size budgets in `next.config.ts`:

```typescript
// Example (not currently implemented)
experimental: {
  bundleSizeLimit: {
    maxSize: 250 * 1024, // 250KB
  },
}
```

### 3. Review Large Dependencies

When adding new dependencies:

- Check their size: `pnpm why <package-name>`
- Consider alternatives with smaller bundle sizes
- Use dynamic imports if the dependency is conditionally used

### 4. Optimize Images and Assets

- Use Next.js Image component for automatic optimization
- Lazy load images below the fold
- Use appropriate image formats (WebP, AVIF)

### 5. Code Splitting

- Use route-based code splitting (automatic in Next.js)
- Split large components into smaller chunks
- Avoid importing entire libraries when only a subset is needed

### 6. Tree Shaking

- Use ES modules for better tree shaking
- Avoid default exports from large libraries
- Import only what you need: `import { specific } from 'library'` instead of `import * from 'library'`

## Identifying Optimization Opportunities

### Red Flags in Bundle Analysis

1. **Large single chunks**: Indicates need for code splitting
2. **Duplicate dependencies**: Same library in multiple chunks
3. **Unused code**: Dependencies imported but not used
4. **Large third-party libraries**: Consider alternatives or dynamic imports

### Common Large Dependencies

Be mindful of these potentially large dependencies:

- `framer-motion`: Animation library (~50KB+)
- `pdf-lib`: PDF manipulation (~100KB+)
- `swagger-ui-react`: API documentation UI (~200KB+)
- `@tanstack/react-query-devtools`: Dev tools (~100KB+)

All of these should be dynamically imported when possible.

## Monitoring in CI/CD

### Recommended Workflow

1. **Pre-commit**: Run bundle analysis (optional, can be slow)
2. **Pull Request**: Compare bundle sizes
3. **Before Release**: Full bundle analysis and review
4. **Post-Deployment**: Monitor real-world performance metrics

### Example GitHub Actions Workflow

```yaml
# .github/workflows/bundle-analysis.yml
name: Bundle Analysis
on:
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: pnpm install
      - run: pnpm analyze
      - uses: actions/upload-artifact@v3
        with:
          name: bundle-analysis
          path: .next/analyze/
```

## Performance Metrics

### Target Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Bundle Size**: < 250KB (gzipped) for initial load

### Monitoring Tools

- **Lighthouse**: Run in CI/CD or manually
- **Web Vitals**: Already implemented via `WebVitalsReporter`
- **Bundle Analyzer**: Visual analysis of bundle composition

## Troubleshooting

### Bundle Size Increased Unexpectedly

1. Check recent dependency additions
2. Review bundle analysis reports
3. Look for duplicate dependencies
4. Check for unnecessary imports

### Dynamic Import Not Working

1. Ensure component is client-side (`'use client'`)
2. Check for SSR issues (use `ssr: false` if needed)
3. Verify import path is correct
4. Check browser console for errors

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Next.js Code Splitting](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Web.dev Bundle Size Guide](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing


