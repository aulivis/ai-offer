/**
 * Conversion tracking utility
 * Tracks key conversion events for analytics
 */

import { clientLogger } from '@/lib/clientLogger';

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

  // Log using structured logger in development
  if (process.env.NODE_ENV === 'development') {
    clientLogger.debug('Analytics event', eventData);
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

// Removed unused exports: trackPageView, trackSignupStart, trackSignupComplete

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

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
