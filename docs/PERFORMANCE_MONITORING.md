# Performance Monitoring Documentation

This document describes the performance monitoring system implemented in the application.

## Overview

The application uses Web Vitals to track Core Web Vitals and other performance metrics. Metrics are automatically collected and sent to Google Analytics (with user consent) for monitoring and analysis.

## Metrics Tracked

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: Measures loading performance
  - Target: < 2.5s (good)
  - Needs improvement: 2.5s - 4.0s
  - Poor: > 4.0s

- **INP (Interaction to Next Paint)**: Measures interactivity (replaces FID)
  - Target: < 200ms (good)
  - Needs improvement: 200ms - 500ms
  - Poor: > 500ms

  **Note:** FID (First Input Delay) has been deprecated and replaced by INP (Interaction to Next Paint) in newer versions of web-vitals. The codebase now uses INP for measuring interactivity.

- **CLS (Cumulative Layout Shift)**: Measures visual stability
  - Target: < 0.1 (good)
  - Needs improvement: 0.1 - 0.25
  - Poor: > 0.25

### Other Metrics

- **FCP (First Contentful Paint)**: Measures initial render
  - Target: < 1.8s (good)
  - Needs improvement: 1.8s - 3.0s
  - Poor: > 3.0s

- **TTFB (Time to First Byte)**: Measures server response time
  - Target: < 600ms (good)
  - Needs improvement: 600ms - 800ms
  - Poor: > 800ms

- **TTI (Time to Interactive)**: Measures time to interactivity
  - Target: < 3.5s (good)
  - Needs improvement: 3.5s - 7.3s
  - Poor: > 7.3s

## Implementation

### WebVitalsReporter Component

The `WebVitalsReporter` component automatically tracks Web Vitals metrics on page load and navigation. It's included in the root layout:

```tsx
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';

<WebVitalsReporter />;
```

### Web Vitals Utilities

The `webVitals.ts` module provides:

- `reportWebVitals(metric)`: Reports a Web Vitals metric to Google Analytics
- `getPerformanceRating(metric, value)`: Gets performance rating (good/needs-improvement/poor)
- `PERFORMANCE_THRESHOLDS`: Performance thresholds for each metric
- `getStoredWebVitals()`: Get stored metrics for debugging (development only)
- `clearStoredWebVitals()`: Clear stored metrics

### Performance Monitor Utilities

The `performanceMonitor.ts` module provides additional utilities:

- `getResourceTimings()`: Get resource timing entries
- `getNavigationTiming()`: Get navigation timing
- `calculateTTI()`: Calculate Time to Interactive
- `getPerformanceMetrics()`: Get performance metrics summary
- `mark(name)`: Create a performance mark
- `measure(name, startMark, endMark)`: Measure performance between marks
- `getMarks()`: Get all performance marks
- `getMeasures()`: Get all performance measures
- `clearPerformanceData()`: Clear all performance data

## Google Analytics Integration

Web Vitals metrics are automatically sent to Google Analytics as events:

- Event name: Metric name (e.g., `LCP`, `FID`, `CLS`)
- Event category: `Web Vitals`
- Event properties:
  - `metric_rating`: good, needs-improvement, or poor
  - `metric_value`: Raw metric value
  - `metric_delta`: Delta from previous value (if available)
  - `navigation_type`: Navigation type (if available)

## Consent

Performance monitoring respects user consent preferences. Metrics are only sent to Google Analytics if the user has granted analytics consent.

## Development

In development mode, Web Vitals metrics are:

- Logged to the console
- Stored in `window.__webVitals` for debugging
- Sent to Google Analytics (if consent is given)

## Usage Examples

### Track Custom Performance Marks

```tsx
import { mark, measure } from '@/lib/performance/performanceMonitor';

// Mark the start of an operation
mark('operation-start');

// ... perform operation ...

// Mark the end and measure
mark('operation-end');
measure('operation-duration', 'operation-start', 'operation-end');
```

### Get Performance Metrics

```tsx
import { getPerformanceMetrics } from '@/lib/performance/performanceMonitor';

const metrics = getPerformanceMetrics();
console.log('Navigation timing:', metrics.navigation);
console.log('Resources:', metrics.resources);
console.log('TTI:', metrics.tti);
```

### Get Stored Web Vitals (Development)

```tsx
import { getStoredWebVitals } from '@/lib/performance/webVitals';

const webVitals = getStoredWebVitals();
console.log('Web Vitals:', webVitals);
```

## Monitoring Dashboard

Web Vitals metrics can be viewed in:

- Google Analytics: Events → Web Vitals category
- Browser DevTools: Performance tab
- Development console: `window.__webVitals` (development only)

## Best Practices

1. **Monitor Core Web Vitals**: Focus on LCP, INP, and CLS as these directly impact user experience (FID is deprecated, replaced by INP)
2. **Set Up Alerts**: Configure alerts in Google Analytics for poor performance metrics
3. **Regular Audits**: Regularly audit performance metrics to identify degradation
4. **Optimize Poor Metrics**: Focus optimization efforts on metrics that are consistently poor
5. **Test on Real Devices**: Test performance on real devices, not just desktop browsers

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/vitals/#core-web-vitals)
- [Google Analytics Web Vitals](https://support.google.com/analytics/answer/12057884)
