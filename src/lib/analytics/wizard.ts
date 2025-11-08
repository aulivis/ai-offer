'use client';

/**
 * Analytics tracking utilities for wizard events
 * Respects user consent preferences
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type WizardEvent = 
  | { type: 'wizard_step_viewed'; step: 1 | 2 | 3 }
  | { type: 'wizard_step_completed'; step: 1 | 2 | 3 }
  | { type: 'wizard_preview_generated'; step: 2 | 3 }
  | { type: 'wizard_offer_submitted'; success: boolean }
  | { type: 'wizard_draft_loaded' }
  | { type: 'wizard_validation_error'; step: 1 | 2 | 3; field: string };

/**
 * Track wizard events to Google Analytics (if consent given)
 */
export function trackWizardEvent(event: WizardEvent) {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  try {
    window.gtag('event', event.type, {
      event_category: 'Offer Wizard',
      ...(event.type === 'wizard_step_viewed' && { step: event.step }),
      ...(event.type === 'wizard_step_completed' && { step: event.step }),
      ...(event.type === 'wizard_preview_generated' && { step: event.step }),
      ...(event.type === 'wizard_offer_submitted' && { success: event.success }),
      ...(event.type === 'wizard_validation_error' && { step: event.step, field: event.field }),
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics tracking failed:', error);
    }
  }
}













