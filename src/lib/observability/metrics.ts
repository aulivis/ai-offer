import { metrics } from '@opentelemetry/api';

import type { MetricAttributes } from '@opentelemetry/api';

const meter = metrics.getMeter('ai-offer.auth');

const magicLinkSendCounter = meter.createCounter('auth.magic_link.send_total', {
  description: 'Counts Supabase magic link send attempts by outcome.',
});

const magicLinkCallbackCounter = meter.createCounter('auth.magic_link.callback_total', {
  description: 'Counts Supabase magic link callback handling outcomes.',
});

const authRouteUsageCounter = meter.createCounter('auth.route.usage_total', {
  description: 'Counts usage of different auth routes (callback vs confirm) for migration tracking.',
});

function mergeAttributes(
  outcome: 'success' | 'failure',
  attributes?: MetricAttributes,
): MetricAttributes {
  return { outcome, ...(attributes ?? {}) };
}

export function recordMagicLinkSend(outcome: 'success' | 'failure', attributes?: MetricAttributes) {
  magicLinkSendCounter.add(1, mergeAttributes(outcome, attributes));
}

export function recordMagicLinkCallback(
  outcome: 'success' | 'failure',
  attributes?: MetricAttributes,
) {
  magicLinkCallbackCounter.add(1, mergeAttributes(outcome, attributes));
}

/**
 * Track which auth route is being used (callback vs confirm) for migration monitoring.
 * This helps identify when it's safe to deprecate the old callback route.
 */
export function recordAuthRouteUsage(
  route: 'callback' | 'confirm',
  outcome: 'success' | 'failure',
  attributes?: MetricAttributes,
) {
  authRouteUsageCounter.add(1, {
    route,
    ...mergeAttributes(outcome, attributes),
  });
}
