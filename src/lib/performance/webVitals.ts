/**
 * Web Vitals Performance Monitoring
 *
 * Tracks Core Web Vitals and other performance metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay) / INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - TTI (Time to Interactive)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 *
 * Integrates with Google Analytics and respects user consent preferences.
 *
 * @module webVitals
 */

import type { Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Performance metric thresholds
 * Based on Web Vitals thresholds and Lighthouse scoring
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Largest Contentful Paint - Target < 2.5s */
  LCP: { good: 2500, needsImprovement: 4000 },
  /** First Input Delay / Interaction to Next Paint - Target < 100ms */
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  /** Cumulative Layout Shift - Target < 0.1 */
  CLS: { good: 0.1, needsImprovement: 0.25 },
  /** First Contentful Paint - Target < 1.8s */
  FCP: { good: 1800, needsImprovement: 3000 },
  /** Time to First Byte - Target < 600ms */
  TTFB: { good: 600, needsImprovement: 800 },
  /** Time to Interactive - Target < 3.5s */
  TTI: { good: 3500, needsImprovement: 7300 },
} as const;

/**
 * Get performance rating based on thresholds
 */
export function getPerformanceRating(
  metric: string,
  value: number,
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) {
    return 'good';
  }

  if (value <= threshold.good) {
    return 'good';
  }
  if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Check if analytics consent is given
 *
 * Uses a synchronous check by reading from cookies.
 * The consent system stores consent in cookies with the name 'consent'.
 *
 * This is a simplified check that reads directly from cookies to avoid
 * circular dependencies with the consent gate system.
 */
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    // Check cookie for consent (matches consent system pattern)
    // The consent cookie contains a JSON object with granted categories
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=');
        const value = valueParts.join('='); // Handle values with '=' in them
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    if (cookies.consent) {
      try {
        const parsed = JSON.parse(cookies.consent);
        // Check if analytics category is granted
        if (parsed?.granted?.analytics === true) {
          return true;
        }
      } catch {
        // Invalid JSON, assume no consent
        return false;
      }
    }

    // If gtag is available, it means analytics script loaded
    // This is a proxy indicator that consent was given
    // However, we should still verify consent from cookies
    if (typeof window.gtag !== 'undefined') {
      // gtag exists, but we couldn't find consent in cookies
      // This might mean consent was given but cookie check failed
      // For safety, default to false in production
      if (process.env.NODE_ENV === 'development') {
        // In development, allow if gtag exists
        return true;
      }
    }
  } catch {
    // Fail silently if consent check fails
    // Default to no consent for privacy
  }

  return false;
}

/**
 * Send metric to Google Analytics
 */
function sendToGoogleAnalytics(metric: Metric) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // Check consent
  if (!hasAnalyticsConsent()) {
    return;
  }

  try {
    const rating = getPerformanceRating(metric.name, metric.value);
    const delta = 'delta' in metric ? metric.delta : undefined;
    const id = 'id' in metric ? metric.id : undefined;
    const navigationType = 'navigationType' in metric ? metric.navigationType : undefined;

    // Send to Google Analytics as an event
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      metric_rating: rating,
      metric_value: metric.value,
      metric_delta: delta,
      navigation_type: navigationType,
    });

    // Also send as a custom metric if using GA4
    window.gtag('event', 'web_vitals', {
      event_category: 'Performance',
      [metric.name]: metric.value,
      [`${metric.name}_rating`]: rating,
      ...(delta && { [`${metric.name}_delta`]: delta }),
      ...(navigationType && { navigation_type: navigationType }),
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Performance monitoring failed to send to GA', error, {
        metricName: metric.name,
      });
    }
  }
}

/**
 * Log metric to console in development
 */
function logMetric(metric: Metric) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const rating = getPerformanceRating(metric.name, metric.value);
  const delta = 'delta' in metric ? metric.delta : undefined;

  // Development-only logging for Web Vitals debugging
  // eslint-disable-next-line no-console
  console.log(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating,
    delta,
    id: 'id' in metric ? metric.id : undefined,
    navigationType: 'navigationType' in metric ? metric.navigationType : undefined,
  });
}

/**
 * Report Web Vitals metrics
 *
 * This function should be called from Next.js's reportWebVitals function
 * in _app.tsx or a custom App component.
 *
 * @param metric - Web Vitals metric
 */
export function reportWebVitals(metric: Metric) {
  // Log to console in development
  logMetric(metric);

  // Send to Google Analytics if consent is given
  sendToGoogleAnalytics(metric);

  // Store metrics in window for debugging/development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    interface WindowWithWebVitals extends Window {
      __webVitals?: Array<Metric & { timestamp: number; url: string }>;
    }
    const win = window as WindowWithWebVitals;
    if (!win.__webVitals) {
      win.__webVitals = [];
    }
    win.__webVitals.push({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
    });
  }
}

/**
 * Get stored Web Vitals metrics (for debugging)
 */
export function getStoredWebVitals(): Metric[] {
  if (typeof window === 'undefined') {
    return [];
  }

  interface WindowWithWebVitals extends Window {
    __webVitals?: Metric[];
  }
  const win = window as WindowWithWebVitals;
  return win.__webVitals || [];
}

/**
 * Clear stored Web Vitals metrics
 */
export function clearStoredWebVitals() {
  if (typeof window === 'undefined') {
    return;
  }

  interface WindowWithWebVitals extends Window {
    __webVitals?: Metric[];
  }
  const win = window as WindowWithWebVitals;
  delete win.__webVitals;
}

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_CONFIG = {
  /** Enable performance monitoring */
  enabled: true,
  /** Sample rate (0-1) for performance monitoring */
  sampleRate: 1.0,
  /** Metrics to track (FID is deprecated, replaced by INP) */
  metrics: ['LCP', 'CLS', 'FCP', 'TTFB', 'INP'] as const,
} as const;
