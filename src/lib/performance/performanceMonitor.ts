/**
 * Performance Monitor Utilities
 *
 * Additional performance monitoring utilities beyond Web Vitals:
 * - Resource timing
 * - Navigation timing
 * - Long tasks
 * - Custom performance marks/measures
 *
 * @module performanceMonitor
 */

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_MONITOR_CONFIG = {
  /** Enable performance monitoring */
  enabled: true,
  /** Sample rate (0-1) for performance monitoring */
  sampleRate: 1.0,
  /** Track resource timing */
  trackResources: true,
  /** Track long tasks */
  trackLongTasks: false, // Requires PerformanceObserver
} as const;

/**
 * Get resource timing entries
 */
export function getResourceTimings(): PerformanceResourceTiming[] {
  if (typeof window === 'undefined' || !window.performance) {
    return [];
  }

  try {
    return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  } catch {
    return [];
  }
}

/**
 * Get navigation timing
 */
export function getNavigationTiming(): PerformanceNavigationTiming | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  try {
    const entries = window.performance.getEntriesByType('navigation');
    return (entries[0] as PerformanceNavigationTiming) || null;
  } catch {
    return null;
  }
}

/**
 * Calculate Time to Interactive (TTI) from performance timing
 *
 * TTI is the time when the page becomes fully interactive.
 * This is an approximation based on DOMContentLoaded and resource loading.
 */
export function calculateTTI(): number | null {
  const navTiming = getNavigationTiming();
  if (!navTiming) {
    return null;
  }

  try {
    // TTI approximation: DOMContentLoaded + 5 seconds
    // Or when all critical resources are loaded
    const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
    const loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;

    // Use the later of DOMContentLoaded or load complete
    return Math.max(domContentLoaded, loadComplete);
  } catch {
    return null;
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics() {
  const navTiming = getNavigationTiming();
  const resources = getResourceTimings();
  const tti = calculateTTI();

  return {
    navigation: navTiming
      ? {
          dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
          connect: navTiming.connectEnd - navTiming.connectStart,
          ttfb: navTiming.responseStart - navTiming.requestStart,
          download: navTiming.responseEnd - navTiming.responseStart,
          domProcessing: navTiming.domComplete - navTiming.domInteractive,
          load: navTiming.loadEventEnd - navTiming.loadEventStart,
          total: navTiming.loadEventEnd - navTiming.fetchStart,
        }
      : null,
    resources: resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
    })),
    tti,
  };
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  try {
    window.performance.mark(name);
  } catch {
    // Fail silently
  }
}

/**
 * Measure performance between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string,
): PerformanceMeasure | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  try {
    if (endMark) {
      return window.performance.measure(name, startMark, endMark);
    }
    return window.performance.measure(name, startMark);
  } catch {
    return null;
  }
}

/**
 * Get all performance marks
 */
export function getMarks(): PerformanceMark[] {
  if (typeof window === 'undefined' || !window.performance) {
    return [];
  }

  try {
    return window.performance.getEntriesByType('mark') as PerformanceMark[];
  } catch {
    return [];
  }
}

/**
 * Get all performance measures
 */
export function getMeasures(): PerformanceMeasure[] {
  if (typeof window === 'undefined' || !window.performance) {
    return [];
  }

  try {
    return window.performance.getEntriesByType('measure') as PerformanceMeasure[];
  } catch {
    return [];
  }
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceData(): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  try {
    window.performance.clearMarks();
    window.performance.clearMeasures();
    window.performance.clearResourceTimings();
  } catch {
    // Fail silently
  }
}

