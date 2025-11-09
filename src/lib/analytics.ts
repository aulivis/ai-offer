/**
 * Conversion tracking utility
 * Tracks key conversion events for analytics
 */

export type ConversionEvent =
  | 'page_view'
  | 'signup_start'
  | 'signup_complete'
  | 'first_offer_created'
  | 'offer_previewed'
  | 'offer_shared'
  | 'offer_downloaded'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'email_captured'
  | 'cta_clicked'
  | 'exit_intent_shown'
  | 'exit_intent_converted';

interface ConversionEventData {
  event: ConversionEvent;
  properties?: Record<string, unknown>;
}

/**
 * Track a conversion event
 */
export function trackConversion(event: ConversionEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const eventData: ConversionEventData = {
    event,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventData);
  }

  // Track with Google Analytics if available
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', event, {
      ...properties,
      event_category: 'conversion',
      event_label: event,
    });
  }

  // Send to your analytics endpoint if needed
  // You can add fetch to your analytics API here
  // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventData) });
}

/**
 * Track page view
 */
export function trackPageView(path: string) {
  trackConversion('page_view', { path });
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaName: string, location: string) {
  trackConversion('cta_clicked', { ctaName, location });
}

/**
 * Track email capture
 */
export function trackEmailCapture(source: string) {
  trackConversion('email_captured', { source });
}

/**
 * Track signup start
 */
export function trackSignupStart(method: string) {
  trackConversion('signup_start', { method });
}

/**
 * Track signup complete
 */
export function trackSignupComplete(method: string) {
  trackConversion('signup_complete', { method });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}








