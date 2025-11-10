'use client';

import { getConsent } from './client';
import type { ConsentRecord } from './types';

type ConsentCategory = 'analytics' | 'marketing';
type ConsentCategories = ConsentRecord['granted'];
type ConsentListener = (categories: ConsentCategories) => void;

const ensureCategories = (input: ConsentCategories | null): ConsentCategories | null => {
  if (!input) {
    return null;
  }

  return {
    necessary: true,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };
};

const readCategoriesFromCookie = (): ConsentCategories | null => {
  const consent = getConsent();

  if (!consent) {
    return null;
  }

  return ensureCategories(consent.granted);
};

export const canRun = (category: ConsentCategory): boolean => {
  const categories = readCategoriesFromCookie();

  // Default to true (all enabled) when there's no consent
  // This matches the cookie bar behavior where all cookies are pre-accepted
  if (!categories) {
    return true;
  }

  return categories[category] === true;
};

export const onConsentChange = (callback: ConsentListener): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler: EventListener = (event) => {
    const customEvent = event as CustomEvent<{ categories?: ConsentCategories }>;
    const categories = ensureCategories(customEvent.detail?.categories ?? null);

    if (categories) {
      callback(categories);
      return;
    }

    const latest = readCategoriesFromCookie();

    if (latest) {
      callback(latest);
    }
  };

  window.addEventListener('consent:updated', handler);

  return () => {
    window.removeEventListener('consent:updated', handler);
  };
};
