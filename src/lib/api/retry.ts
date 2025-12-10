/**
 * API Retry Utilities
 *
 * Provides retry logic with exponential backoff for external API calls.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes?: number[];
  retryableErrors?: string[];
}

export const DEFAULT_API_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  retryableStatusCodes: [429, 500, 502, 503, 504], // Rate limit and server errors
  retryableErrors: ['timeout', 'network', 'econnrefused', 'econnreset'],
};

/**
 * Checks if an error is retryable based on the error type and configuration
 */
export function isRetryableError(
  error: unknown,
  config: RetryConfig = DEFAULT_API_RETRY_CONFIG,
): boolean {
  if (!error) {
    return false;
  }

  // Check HTTP status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = typeof error.status === 'number' ? error.status : null;
    if (status && config.retryableStatusCodes?.includes(status)) {
      return true;
    }
  }

  // Check error messages
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  for (const retryableError of config.retryableErrors || []) {
    if (lowerMessage.includes(retryableError.toLowerCase())) {
      return true;
    }
  }

  // Non-retryable errors (permanent failures)
  const nonRetryablePatterns = [
    'invalid',
    'validation',
    'permission denied',
    'unauthorized',
    'forbidden',
    'not found',
    'malformed',
    'bad request',
    '400',
    '401',
    '403',
    '404',
  ];

  for (const pattern of nonRetryablePatterns) {
    if (lowerMessage.includes(pattern)) {
      return false;
    }
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Calculates delay for retry attempt using exponential backoff with jitter
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_API_RETRY_CONFIG,
): number {
  // Exponential backoff: base_delay * 2^attempt
  let delay = config.baseDelayMs * Math.pow(2, attemptNumber);

  // Cap at max delay
  if (delay > config.maxDelayMs) {
    delay = config.maxDelayMs;
  }

  // Add jitter: random 0-20% to prevent thundering herd
  const jitter = Math.floor(Math.random() * delay * 0.2);

  return delay + jitter;
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_API_RETRY_CONFIG,
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, config)) {
        throw error; // Don't retry non-retryable errors
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Calculate delay and wait
      const delayMs = calculateRetryDelay(attempt, config);
      if (onRetry) {
        onRetry(attempt + 1, error, delayMs);
      }
      await sleep(delayMs);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Retries an async operation with exponential backoff and custom error handling
 */
export async function retryWithBackoffAndErrorHandling<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_API_RETRY_CONFIG,
  options?: {
    onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  },
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Use custom shouldRetry function if provided, otherwise use default
      const shouldRetry = options?.shouldRetry
        ? options.shouldRetry(error, attempt)
        : isRetryableError(error, config);

      if (!shouldRetry) {
        throw error; // Don't retry
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Calculate delay and wait
      const delayMs = calculateRetryDelay(attempt, config);
      if (options?.onRetry) {
        options.onRetry(attempt + 1, error, delayMs);
      }
      await sleep(delayMs);
    }
  }

  // All retries exhausted
  throw lastError;
}

