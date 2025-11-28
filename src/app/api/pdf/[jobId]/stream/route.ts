/**
 * GET /api/pdf/[jobId]/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time PDF job status updates.
 * Streams job status changes to the client as they happen.
 *
 * This eliminates the need for polling and provides instant status updates.
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation';

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

const pdfJobIdParamsSchema = z.object({
  jobId: uuidSchema,
});

export const GET = withAuth(async (req: AuthenticatedNextRequest, { params }: RouteParams) => {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });

  // Validate route parameters
  const resolvedParams = await params;
  const parsed = pdfJobIdParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const jobId = parsed.data.jobId;

  // Verify job belongs to user
  const sb = await supabaseServer();
  const { data: job, error: jobError } = await sb
    .from('pdf_jobs')
    .select('id, user_id, status, pdf_url, error_message, created_at')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError || !job || job.user_id !== req.user.id) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  let currentStatus = job.status;
  let currentPdfUrl = job.pdf_url;
  let currentError = job.error_message;

  const stream = new ReadableStream({
    async start(controller) {
      const sendMessage = (data: unknown) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          log.error('Failed to encode SSE message', error);
        }
      };

      const sendComment = (comment: string) => {
        try {
          controller.enqueue(encoder.encode(`: ${comment}\n\n`));
        } catch (error) {
          log.error('Failed to send SSE comment', error);
        }
      };

      // Send initial status
      sendMessage({
        jobId,
        status: job.status,
        pdfUrl: job.pdf_url || null,
        error: job.error_message || null,
        timestamp: new Date().toISOString(),
      });

      // If job is already terminal, close connection
      if (job.status === 'completed' || job.status === 'dead_letter_queue') {
        controller.close();
        return;
      }

      // Subscribe to job status changes via Supabase Realtime
      let subscription: ReturnType<typeof sb.channel> | null = null;

      try {
        subscription = sb
          .channel(`pdf-job-${jobId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'pdf_jobs',
              filter: `id=eq.${jobId}`,
            },
            (payload) => {
              try {
                const updatedJob = payload.new as {
                  id: string;
                  status: string;
                  pdf_url: string | null;
                  error_message: string | null;
                };

                // Only send update if status or data changed
                if (
                  updatedJob.status !== currentStatus ||
                  updatedJob.pdf_url !== currentPdfUrl ||
                  updatedJob.error_message !== currentError
                ) {
                  currentStatus = updatedJob.status;
                  currentPdfUrl = updatedJob.pdf_url;
                  currentError = updatedJob.error_message;

                  sendMessage({
                    jobId: updatedJob.id,
                    status: updatedJob.status,
                    pdfUrl: updatedJob.pdf_url || null,
                    error: updatedJob.error_message || null,
                    timestamp: new Date().toISOString(),
                  });

                  // Close connection if job is terminal
                  if (
                    updatedJob.status === 'completed' ||
                    updatedJob.status === 'dead_letter_queue'
                  ) {
                    if (subscription) {
                      subscription.unsubscribe();
                    }
                    controller.close();
                  }
                }
              } catch (error) {
                log.error('Error processing realtime update', error);
              }
            },
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              log.info('Subscribed to PDF job status updates', { jobId });
            } else if (status === 'CHANNEL_ERROR') {
              log.warn('Channel subscription error', { jobId, status });
            }
          });

        // Keep connection alive with heartbeat (every 30 seconds)
        const heartbeatInterval = setInterval(() => {
          try {
            sendComment('heartbeat');
          } catch (error) {
            log.error('Error sending heartbeat', error);
            clearInterval(heartbeatInterval);
            if (subscription) {
              subscription.unsubscribe();
            }
            controller.close();
          }
        }, 30000);

        // Poll job status as fallback (in case Realtime fails)
        // Poll every 2 seconds
        const pollInterval = setInterval(async () => {
          try {
            const { data: currentJob, error: pollError } = await sb
              .from('pdf_jobs')
              .select('status, pdf_url, error_message')
              .eq('id', jobId)
              .maybeSingle();

            if (pollError || !currentJob) {
              return;
            }

            // Only send update if status or data changed
            if (
              currentJob.status !== currentStatus ||
              currentJob.pdf_url !== currentPdfUrl ||
              currentJob.error_message !== currentError
            ) {
              currentStatus = currentJob.status;
              currentPdfUrl = currentJob.pdf_url;
              currentError = currentJob.error_message;

              sendMessage({
                jobId,
                status: currentJob.status,
                pdfUrl: currentJob.pdf_url || null,
                error: currentJob.error_message || null,
                timestamp: new Date().toISOString(),
              });

              // Close connection if job is terminal
              if (currentJob.status === 'completed' || currentJob.status === 'dead_letter_queue') {
                clearInterval(pollInterval);
                clearInterval(heartbeatInterval);
                if (subscription) {
                  subscription.unsubscribe();
                }
                controller.close();
              }
            }
          } catch (error) {
            log.error('Error polling job status', error);
          }
        }, 2000);

        // Cleanup on request abort
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          clearInterval(pollInterval);
          if (subscription) {
            subscription.unsubscribe();
          }
          controller.close();
        });

        // Timeout after 5 minutes (jobs should complete faster)
        const timeout = setTimeout(
          () => {
            log.warn('SSE stream timeout', { jobId });
            clearInterval(heartbeatInterval);
            clearInterval(pollInterval);
            if (subscription) {
              subscription.unsubscribe();
            }
            controller.close();
          },
          5 * 60 * 1000,
        );

        // Cleanup on stream close
        stream.getReader().closed.then(() => {
          clearInterval(heartbeatInterval);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          if (subscription) {
            subscription.unsubscribe();
          }
        });
      } catch (error) {
        log.error('SSE stream setup error', error);
        if (subscription) {
          subscription.unsubscribe();
        }
        controller.close();
      }
    },
  });

  // Return streaming response with SSE headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
});
