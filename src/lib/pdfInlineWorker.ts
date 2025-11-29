import type { SupabaseClient } from '@supabase/supabase-js';
import type { HTTPRequest, HTTPResponse, Page } from 'puppeteer';

import type { PdfJobInput } from '@/lib/queue/pdf';
import { renderRuntimePdfHtml } from '@/lib/pdfRuntime';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { completePdfJobTransactional, failPdfJobWithRollback } from '@/lib/pdf/transactional';
import { setPdfMetadata, type PdfMetadata, type PuppeteerPage } from '@/lib/pdfConfig';
import { logger } from '@/lib/logger';

const JOB_TIMEOUT_MS = 90_000;

async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

type PageEventHandler = (...args: unknown[]) => void;

function detachPageListener(
  page: Page,
  eventName: Parameters<Page['on']>[0],
  handler: PageEventHandler,
) {
  const anyPage = page as unknown as {
    off?: (event: Parameters<Page['on']>[0], handler: PageEventHandler) => void;
    removeListener?: (event: Parameters<Page['on']>[0], handler: PageEventHandler) => void;
  };

  if (typeof anyPage.off === 'function') {
    anyPage.off(eventName, handler);
  } else if (typeof anyPage.removeListener === 'function') {
    anyPage.removeListener(eventName, handler);
  }
}

async function setContentWithNetworkIdleLogging(page: Page, html: string, context: string) {
  const requestFailures: Array<{ url: string; errorText?: string | null }> = [];
  const responseErrors: Array<{ url: string; status: number }> = [];

  const onRequestFailed = (request: HTTPRequest) => {
    const failure = request.failure();
    requestFailures.push({ url: request.url(), errorText: failure?.errorText ?? null });
  };

  const onResponse = (response: HTTPResponse) => {
    const status = response.status();
    if (status >= 400) {
      responseErrors.push({ url: response.url(), status });
    }
  };

  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  const startedAt = Date.now();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
  } catch (error) {
    logger.error(`[${context}] page.setContent failed while waiting for networkidle0`, error);
    throw error;
  } finally {
    detachPageListener(page, 'requestfailed', onRequestFailed as PageEventHandler);
    detachPageListener(page, 'response', onResponse as PageEventHandler);

    const elapsed = Date.now() - startedAt;
    logger.info(`[${context}] page.setContent(waitUntil=networkidle0) completed in ${elapsed}ms`);

    if (requestFailures.length > 0) {
      logger.warn(
        `[${context}] ${requestFailures.length} request(s) failed while loading PDF content`,
        { requestFailures },
      );
    }

    if (responseErrors.length > 0) {
      logger.warn(
        `[${context}] ${responseErrors.length} response(s) returned error status while loading PDF content`,
        { responseErrors },
      );
    }
  }
}

/**
 * Atomically claim a job for processing, similar to edge worker's claimJobForProcessing.
 * Returns true if job was successfully claimed, false if already claimed by another worker.
 */
async function claimJobForInlineProcessing(
  supabase: SupabaseClient,
  jobId: string,
): Promise<boolean> {
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('pdf_jobs')
    .update({ status: 'processing', started_at: startedAt, error_message: null })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to claim job for inline processing: ${error.message}`);
  }

  return Boolean(data);
}

export async function processPdfJobInline(
  supabase: SupabaseClient,
  job: PdfJobInput,
): Promise<string | null> {
  // Atomically claim the job - prevents double processing if edge worker already claimed it
  const claimed = await claimJobForInlineProcessing(supabase, job.jobId);
  if (!claimed) {
    // Job was already claimed by edge worker or another process
    // Check if it's already completed or failed
    const { data: existingJob } = await supabase
      .from('pdf_jobs')
      .select('status, pdf_url')
      .eq('id', job.jobId)
      .maybeSingle();

    if (existingJob?.status === 'completed' && existingJob.pdf_url) {
      // Job already completed by edge worker
      return existingJob.pdf_url;
    }

    if (existingJob?.status === 'failed') {
      // Job already failed, throw error to trigger retry or proper error handling
      throw new Error('PDF job was already processed and failed by another worker');
    }

    // Job is being processed by edge worker, wait a bit and check again
    // This handles the case where edge worker is still processing
    throw new Error('PDF job is already being processed by edge worker');
  }

  let uploadedToStorage = false;

  try {
    const { default: puppeteer } = await import('puppeteer');

    const html = job.runtimeTemplate ? renderRuntimePdfHtml(job.runtimeTemplate) : job.html;

    assertPdfEngineHtml(html, 'Inline PDF job HTML');

    const pdfBinary = await withTimeout(
      async () => {
        const browser = await puppeteer.launch({
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
          headless: true,
        });

        try {
          let page: Page | null = null;

          try {
            page = await browser.newPage();
            page.setDefaultNavigationTimeout(JOB_TIMEOUT_MS);
            page.setDefaultTimeout(JOB_TIMEOUT_MS);

            // Set viewport for consistent rendering
            await page.setViewport({
              width: 1200,
              height: 1600,
              deviceScaleFactor: 2,
            });

            // Use HTML as-is for 1-to-1 matching (no transformations)
            // Images are already embedded as data URLs in HTML templates
            await setContentWithNetworkIdleLogging(page, html, 'inline-pdf');

            // Extract document title for metadata
            const documentTitle = await page.title().catch(() => 'Offer Document');

            // Create PDF metadata
            const pdfMetadata: PdfMetadata = {
              title: documentTitle || 'Offer Document',
              author: 'AI Offer Platform',
              subject: 'Business Offer',
              keywords: 'offer,business,proposal',
              creator: 'AI Offer Platform',
              producer: 'AI Offer Platform',
            };

            // Set PDF metadata
            await setPdfMetadata(page as unknown as PuppeteerPage, pdfMetadata);

            // Generate PDF with simplest 1-to-1 matching approach
            // No header/footer templates, no compression, just convert HTML to PDF
            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true, // Preserve colors and backgrounds
              margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm',
              },
              preferCSSPageSize: false, // Use A4 format, not CSS page size
            });

            return pdfBuffer;
          } finally {
            if (page) {
              try {
                await page.close();
              } catch (closeError) {
                logger.error('Failed to close Puppeteer page (inline worker)', closeError);
              }
            }
          }
        } finally {
          try {
            await browser.close();
          } catch (closeError) {
            logger.error('Failed to close Puppeteer browser (inline worker)', closeError);
          }
        }
      },
      JOB_TIMEOUT_MS,
      'PDF generation timed out',
    );

    const pdfUint8 = pdfBinary instanceof Uint8Array ? pdfBinary : new Uint8Array(pdfBinary);
    const pdfArrayBuffer = new ArrayBuffer(pdfUint8.byteLength);
    new Uint8Array(pdfArrayBuffer).set(pdfUint8);

    const upload = await supabase.storage.from('offers').upload(job.storagePath, pdfArrayBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    uploadedToStorage = true;

    const { data: publicUrlData } = supabase.storage.from('offers').getPublicUrl(job.storagePath);
    const pdfUrl = publicUrlData?.publicUrl ?? null;

    if (!pdfUrl) {
      throw new Error('Failed to get public URL for generated PDF');
    }

    // Verify PDF is actually downloadable before using transactional completion
    // This ensures we don't proceed if PDF is not accessible
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout
      let verifyResponse: Response;
      try {
        verifyResponse = await fetch(pdfUrl, {
          method: 'HEAD',
          signal: abortController.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!verifyResponse.ok) {
        logger.error('PDF verification failed - file not accessible', {
          offerId: job.offerId,
          pdfUrl,
          status: verifyResponse.status,
          statusText: verifyResponse.statusText,
        });
        throw new Error(
          `PDF is not accessible: ${verifyResponse.status} ${verifyResponse.statusText}`,
        );
      }

      // Verify it's actually a PDF by checking Content-Type
      const contentType = verifyResponse.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf')) {
        logger.error('PDF verification failed - incorrect content type', {
          offerId: job.offerId,
          pdfUrl,
          contentType,
        });
        throw new Error(`PDF has incorrect content type: ${contentType}`);
      }

      logger.info('Verified: PDF is accessible and downloadable', {
        offerId: job.offerId,
        pdfUrl,
        contentType,
      });
    } catch (verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error('Failed to verify PDF accessibility', {
        offerId: job.offerId,
        pdfUrl,
        error: errorMessage,
      });
      throw new Error(`PDF is not accessible: ${errorMessage}`);
    }

    // Calculate processing duration
    const { data: jobWithStartTime } = await supabase
      .from('pdf_jobs')
      .select('started_at')
      .eq('id', job.jobId)
      .single();

    let processingDurationMs: number | null = null;
    if (jobWithStartTime?.started_at) {
      const startedAt = new Date(jobWithStartTime.started_at);
      const completedAt = new Date();
      processingDurationMs = completedAt.getTime() - startedAt.getTime();
    }

    // Use transactional function to atomically:
    // 1. Increment quota (checks limits)
    // 2. Update offer with PDF URL
    // 3. Mark job as completed
    // All operations succeed or fail together
    logger.info('Completing PDF job transactionally', {
      jobId: job.jobId,
      offerId: job.offerId,
      pdfUrl,
      processingDurationMs,
    });

    const completionResult = await completePdfJobTransactional(
      supabase,
      job.jobId,
      pdfUrl,
      processingDurationMs,
    );

    if (!completionResult.success) {
      logger.error('Transactional job completion failed', {
        jobId: job.jobId,
        error: completionResult.error,
      });
      throw new Error(completionResult.error || 'Failed to complete PDF job');
    }

    logger.info('PDF job completed successfully via transactional function', {
      jobId: job.jobId,
      offerId: job.offerId,
      pdfUrl,
    });

    // Dispatch webhook callback if provided
    if (job.callbackUrl && pdfUrl) {
      if (isPdfWebhookUrlAllowed(job.callbackUrl)) {
        try {
          await fetch(job.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: job.jobId,
              offerId: job.offerId,
              pdfUrl,
              downloadToken: job.jobId,
            }),
          });
        } catch (callbackError) {
          logger.error('Webhook error (inline worker)', callbackError);
        }
      } else {
        logger.warn('Skipping webhook dispatch for disallowed URL (inline worker)', {
          callbackUrl: job.callbackUrl,
        });
      }
    }

    return pdfUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (uploadedToStorage) {
      try {
        await supabase.storage.from('offers').remove([job.storagePath]);
      } catch (cleanupError) {
        logger.error('Failed to remove uploaded PDF after inline worker error', cleanupError);
      }
    }

    // Get current retry information from database
    const { data: jobForRetry } = await supabase
      .from('pdf_jobs')
      .select('retry_count, max_retries')
      .eq('id', job.jobId)
      .single();

    const currentRetryCount =
      typeof jobForRetry?.retry_count === 'number' ? jobForRetry.retry_count : 0;
    const maxRetries = typeof jobForRetry?.max_retries === 'number' ? jobForRetry.max_retries : 3;

    // Use transactional failure function to handle job failure with automatic quota rollback
    // This atomically: rolls back quota if incremented, clears offer PDF URL, and updates job status
    const failureResult = await failPdfJobWithRollback(
      supabase,
      job.jobId,
      message,
      currentRetryCount,
      maxRetries,
    );

    if (!failureResult.success) {
      logger.error('Failed to process job failure transactionally', {
        jobId: job.jobId,
        error: failureResult.error,
      });
      // Fallback to basic error handling if transactional failure processing fails
    }

    throw error instanceof Error ? error : new Error(message);
  }
}
