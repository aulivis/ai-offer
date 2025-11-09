'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { reportWebVitals } from '@/lib/performance/webVitals';

/**
 * WebVitalsReporter Component
 * 
 * Reports Web Vitals metrics to Google Analytics and console.
 * Automatically tracks Core Web Vitals and other performance metrics.
 * 
 * Note: FID is deprecated and replaced by INP in newer versions of web-vitals.
 * 
 * @example
 * ```tsx
 * <WebVitalsReporter />
 * ```
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Only track on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Track Core Web Vitals
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onINP(reportWebVitals); // INP replaces FID
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null;
}

