/**
 * React hook for subscribing to PDF job status updates via Server-Sent Events (SSE)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { logger } from '@/lib/logger';

export interface PdfJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter_queue';
  pdfUrl: string | null;
  error: string | null;
  timestamp: string;
}

export interface UsePdfJobStatusStreamOptions {
  jobId: string;
  enabled?: boolean;
  onStatusUpdate?: (status: PdfJobStatus) => void;
  onError?: (error: Error) => void;
  onComplete?: (status: PdfJobStatus) => void;
}

export function usePdfJobStatusStream({
  jobId,
  enabled = true,
  onStatusUpdate,
  onError,
  onComplete,
}: UsePdfJobStatusStreamOptions) {
  const sb = useSupabase();
  const [status, setStatus] = useState<PdfJobStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // Start with 2 seconds

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !jobId || eventSourceRef.current) {
      return;
    }

    try {
      // Get auth token for authenticated request
      sb.auth.getSession().then(({ data: { session } }) => {
        if (!session?.access_token) {
          const err = new Error('Not authenticated');
          setError(err);
          onError?.(err);
          return;
        }

        const url = `/api/pdf/${jobId}/stream`;
        const eventSource = new EventSource(url, {
          // Note: EventSource doesn't support custom headers directly
          // We'll need to pass auth via query param or use a different approach
          // For now, the endpoint will use the cookie/session for auth
        } as EventSourceInit);

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          logger.info('SSE connection opened', { jobId });
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as PdfJobStatus;
            setStatus(data);
            onStatusUpdate?.(data);

            // Call onComplete if job is terminal
            if (data.status === 'completed' || data.status === 'dead_letter_queue') {
              onComplete?.(data);
              cleanup();
            }
          } catch (err) {
            logger.error('Failed to parse SSE message', err, { jobId, data: event.data });
          }
        };

        eventSource.onerror = (event) => {
          logger.error('SSE connection error', event, { jobId });
          setIsConnected(false);

          // Attempt to reconnect if not in terminal state
          if (
            status === null ||
            (status.status !== 'completed' && status.status !== 'dead_letter_queue')
          ) {
            cleanup();

            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current += 1;
              const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff

              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);

              logger.info('Reconnecting to SSE stream', {
                jobId,
                attempt: reconnectAttemptsRef.current,
                delay,
              });
            } else {
              const err = new Error('Max reconnection attempts reached');
              setError(err);
              onError?.(err);
            }
          }
        };
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create SSE connection');
      setError(error);
      onError?.(error);
    }
  }, [enabled, jobId, sb, onStatusUpdate, onError, onComplete, status, cleanup]);

  useEffect(() => {
    if (enabled && jobId) {
      connect();
    }

    return cleanup;
  }, [enabled, jobId, connect, cleanup]);

  return {
    status,
    isConnected,
    error,
    reconnect: connect,
  };
}
