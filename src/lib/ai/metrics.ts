/**
 * AI Generation Metrics
 *
 * Provides OpenTelemetry metrics for AI generation operations.
 * Tracks duration, cost, token usage, and other important metrics.
 */

import { createLogger } from '@/lib/logger';
import { isOpenTelemetryEnabled } from '@/env.server';

export interface AiGenerationMetrics {
  duration: number; // milliseconds
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  cacheHit: boolean;
  retries: number;
}

/**
 * Records metrics to OpenTelemetry (if available)
 */

export function recordAiMetric(
  name: string,
  value: number,
  attributes: Record<string, string | number | boolean> = {},
): void {
  try {
    // Use validated environment helper for infrastructure detection
    if (typeof process !== 'undefined' && isOpenTelemetryEnabled()) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { metrics } = require('@opentelemetry/api');
      const meter = metrics.getMeter('ai-generation');
      const counter = meter.createCounter(name);
      counter.add(value, attributes);
    }
  } catch (_error) {
    // OpenTelemetry not available or not configured - silently fail
    // Metrics will still be logged via structured logging
  }
}

/**
 * Records AI generation completion metrics
 */
export function recordAiGeneration(
  metrics: AiGenerationMetrics,
  log?: ReturnType<typeof createLogger>,
): void {
  // Record duration
  recordAiMetric('ai.generate.duration', metrics.duration, {
    model: metrics.model,
    cache_hit: metrics.cacheHit ? 'true' : 'false',
    retries: metrics.retries,
  });

  // Record token usage if available
  if (metrics.tokens) {
    recordAiMetric('ai.generate.tokens', metrics.tokens.total, {
      model: metrics.model,
      token_type: 'total',
    });
    recordAiMetric('ai.generate.tokens', metrics.tokens.prompt, {
      model: metrics.model,
      token_type: 'prompt',
    });
    recordAiMetric('ai.generate.tokens', metrics.tokens.completion, {
      model: metrics.model,
      token_type: 'completion',
    });

    // Estimate cost (approximate pricing for gpt-4o-mini)
    const costPerToken = {
      prompt: 0.00000015, // $0.15 per 1M tokens
      completion: 0.0000006, // $0.60 per 1M tokens
    };
    const estimatedCost =
      metrics.tokens.prompt * costPerToken.prompt +
      metrics.tokens.completion * costPerToken.completion;

    recordAiMetric('ai.generate.cost', estimatedCost * 1000, {
      // Store in millicents for precision
      model: metrics.model,
      currency: 'usd',
    });
  }

  // Record generation count
  recordAiMetric('ai.generate.count', 1, {
    model: metrics.model,
    cache_hit: metrics.cacheHit ? 'true' : 'false',
    had_retries: metrics.retries > 0 ? 'true' : 'false',
  });

  if (metrics.retries > 0) {
    recordAiMetric('ai.generate.retry.count', metrics.retries, {
      model: metrics.model,
    });
  }

  // Log for structured logging
  log?.info('AI generation metrics recorded', {
    duration: metrics.duration,
    model: metrics.model,
    cacheHit: metrics.cacheHit,
    retries: metrics.retries,
    tokens: metrics.tokens,
  });
}

/**
 * Helper to calculate token count from text (approximate)
 * This is a rough estimate - OpenAI API provides exact counts in usage fields
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters (for English/Hungarian)
  // This is approximate and should be replaced with actual token counts from API
  return Math.ceil(text.length / 4);
}

/**
 * Extracts token usage from OpenAI API response
 */
export function extractTokenUsage(response: {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}): { prompt: number; completion: number; total: number } | undefined {
  const usage = response.usage;
  if (!usage) {
    return undefined;
  }

  return {
    prompt: usage.prompt_tokens || 0,
    completion: usage.completion_tokens || 0,
    total: usage.total_tokens || 0,
  };
}
