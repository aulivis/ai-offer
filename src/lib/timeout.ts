import { type NextRequest, NextResponse } from 'next/server';

/**
 * Creates an AbortController with a timeout.
 * Useful for ensuring requests don't hang indefinitely.
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Clear timeout if signal is aborted externally
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeout);
  });

  return controller.signal;
}

/**
 * Wraps an async operation with a timeout.
 * Throws an error if the operation exceeds the timeout.
 */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  const signal = createTimeoutSignal(timeoutMs);

  try {
    return await operation(signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${errorMessage} (${timeoutMs}ms)`);
    }
    throw error;
  }
}

/**
 * Default timeout values for different operation types
 */
export const API_TIMEOUTS = {
  DEFAULT: 30_000, // 30 seconds
  AI_GENERATE: 120_000, // 2 minutes for AI operations
  AI_PREVIEW: 60_000, // 1 minute for previews
  FILE_UPLOAD: 60_000, // 1 minute for file uploads
  DATABASE: 10_000, // 10 seconds for database operations
} as const;
















