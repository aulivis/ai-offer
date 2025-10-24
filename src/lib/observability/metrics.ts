import { metrics } from '@opentelemetry/api';

import type { MetricAttributes } from '@opentelemetry/api';

const meter = metrics.getMeter('ai-offer.auth');

const magicLinkSendCounter = meter.createCounter('auth.magic_link.send_total', {
  description: 'Counts Supabase magic link send attempts by outcome.',
});

const magicLinkCallbackCounter = meter.createCounter('auth.magic_link.callback_total', {
  description: 'Counts Supabase magic link callback handling outcomes.',
});

function mergeAttributes(outcome: 'success' | 'failure', attributes?: MetricAttributes): MetricAttributes {
  return { outcome, ...(attributes ?? {}) };
}

export function recordMagicLinkSend(outcome: 'success' | 'failure', attributes?: MetricAttributes) {
  magicLinkSendCounter.add(1, mergeAttributes(outcome, attributes));
}

export function recordMagicLinkCallback(outcome: 'success' | 'failure', attributes?: MetricAttributes) {
  magicLinkCallbackCounter.add(1, mergeAttributes(outcome, attributes));
}
