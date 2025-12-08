import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
import {
  createPdfWebhookAllowlist,
  isPdfWebhookUrlAllowed,
  splitAllowlist,
} from '../../shared/pdfWebhook.ts';
import { assertPdfEngineHtml } from '../../shared/pdfHtmlSignature.ts';
import { createDenoLogger } from '../../shared/logger.ts';
import { normalizeDate } from './dateUtils.ts';

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const pdfWebhookAllowlist = createPdfWebhookAllowlist(
  splitAllowlist(Deno.env.get('PDF_WEBHOOK_ALLOWLIST')),
);

const JOB_TIMEOUT_MS = 90_000;
const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type PageEventHandler = (...args: unknown[]) => void;

type PuppeteerRequest = {
  failure?: () => { errorText?: string | null } | null;
  url?: () => string | undefined;
};

type PuppeteerResponse = {
  status?: () => number | undefined;
  url?: () => string | undefined;
};

type PuppeteerPageLike = {
  on: (event: string, handler: PageEventHandler) => void;
  off?: (event: string, handler: PageEventHandler) => void;
  removeListener?: (event: string, handler: PageEventHandler) => void;
  setDefaultNavigationTimeout: (timeout: number) => void;
  setDefaultTimeout: (timeout: number) => void;
  setContent: (html: string, options: { waitUntil: 'networkidle0' }) => Promise<void>;
  pdf: (options: {
    printBackground: boolean;
    preferCSSPageSize: boolean;
    displayHeaderFooter: boolean;
    headerTemplate: string;
    footerTemplate: string;
    margin: { top: string; right: string; bottom: string; left: string };
  }) => Promise<Uint8Array | ArrayBuffer>;
  close: () => Promise<void>;
};

function detachPageListener(
  page: {
    off?: (event: string, handler: PageEventHandler) => void;
    removeListener?: (event: string, handler: PageEventHandler) => void;
  },
  eventName: string,
  handler: PageEventHandler,
) {
  if (typeof page.off === 'function') {
    page.off(eventName, handler);
  } else if (typeof page.removeListener === 'function') {
    page.removeListener(eventName, handler);
  }
}

async function setContentWithNetworkIdleLogging(
  page: PuppeteerPageLike,
  html: string,
  context: string,
  logger: ReturnType<typeof createDenoLogger>,
) {
  const requestFailures: Array<{ url: string; errorText?: string | null }> = [];
  const responseErrors: Array<{ url: string; status: number }> = [];

  const onRequestFailed: PageEventHandler = (rawRequest) => {
    const request = rawRequest as PuppeteerRequest;
    const failure = request.failure?.();
    requestFailures.push({
      url: request.url?.() ?? 'unknown',
      errorText: failure?.errorText ?? null,
    });
  };

  const onResponse: PageEventHandler = (rawResponse) => {
    const response = rawResponse as PuppeteerResponse;
    const status =
      typeof response.status === 'function' ? response.status() : Number(response.status ?? NaN);
    if (Number.isFinite(status) && Number(status) >= 400) {
      responseErrors.push({
        url:
          typeof response.url === 'function' ? response.url() : String(response.url ?? 'unknown'),
        status: Number(status),
      });
    }
  };

  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  const startedAt = Date.now();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
  } catch (error) {
    logger.error('page.setContent failed while waiting for networkidle0', error, { context });
    throw error;
  } finally {
    detachPageListener(page, 'requestfailed', onRequestFailed);
    detachPageListener(page, 'response', onResponse);

    const elapsed = Date.now() - startedAt;
    logger.info('page.setContent completed', { context, elapsed });

    if (requestFailures.length > 0) {
      logger.warn('Request failures while loading PDF content', {
        context,
        failureCount: requestFailures.length,
        failures: requestFailures,
      });
    }

    if (responseErrors.length > 0) {
      logger.warn('Response errors while loading PDF content', {
        context,
        errorCount: responseErrors.length,
        errors: responseErrors,
      });
    }
  }
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = assertEnv(Deno.env.get('SUPABASE_URL'), 'SUPABASE_URL');
  const supabaseKey = assertEnv(
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    'SUPABASE_SERVICE_ROLE_KEY',
  );

  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  const jobId = body.jobId;
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId missing' }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  // Create logger with job context
  const logger = createDenoLogger({ jobId, functionName: 'pdf-worker' });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: job, error: jobError } = await supabase
    .from('pdf_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobError || !job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      headers: JSON_HEADERS,
      status: 404,
    });
  }

  // Allow processing of pending jobs OR failed jobs that are ready for retry
  const isPending = job.status === 'pending';
  const isRetryReady =
    job.status === 'failed' &&
    typeof job.next_retry_at === 'string' &&
    new Date(job.next_retry_at) <= new Date();

  if (!isPending && !isRetryReady) {
    return new Response(JSON.stringify({ error: 'Job already processed or not ready for retry' }), {
      headers: JSON_HEADERS,
      status: 409,
    });
  }

  const payload = (job.payload ?? {}) as PdfJobPayload;
  const html = typeof payload.html === 'string' && payload.html ? payload.html : '';

  // Extract retry information (with defaults for backward compatibility)
  const currentRetryCount = typeof job.retry_count === 'number' ? job.retry_count : 0;
  const maxRetries = typeof job.max_retries === 'number' ? job.max_retries : 3;

  if (!html) {
    await finalizeJobFailure(
      supabase,
      jobId,
      'Job payload missing HTML',
      currentRetryCount,
      maxRetries,
      logger,
    );
    return new Response(JSON.stringify({ error: 'Job payload missing HTML' }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  try {
    assertPdfEngineHtml(html, 'PDF job payload HTML');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF job payload failed validation.';
    await finalizeJobFailure(supabase, jobId, message, currentRetryCount, maxRetries, logger);
    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  let claimResult: { claimed: boolean; reason?: string };
  try {
    claimResult = await claimJobForProcessing(supabase, jobId);
  } catch (statusError) {
    logger.error('Failed to update PDF job status to processing', statusError);
    return new Response(JSON.stringify({ error: 'Failed to update job status' }), {
      headers: JSON_HEADERS,
      status: 500,
    });
  }

  if (!claimResult.claimed) {
    return new Response(
      JSON.stringify({
        error: claimResult.reason || 'Job already processed or not ready for processing',
      }),
      {
        headers: JSON_HEADERS,
        status: 409,
      },
    );
  }

  const payloadPeriodStart =
    typeof payload.usagePeriodStart === 'string' && payload.usagePeriodStart
      ? payload.usagePeriodStart
      : null;
  const _usagePeriodStart = normalizeDate(
    payloadPeriodStart,
    new Date(job.created_at ?? new Date()).toISOString().slice(0, 10),
  );
  // The billing window must be deterministic: prefer the payload-provided period
  // start and only fall back to the job timestamp when the payload omits it.
  const _userLimit = Number.isFinite(payload.userLimit ?? NaN) ? Number(payload.userLimit) : null;
  const _deviceId =
    typeof payload.deviceId === 'string' && payload.deviceId ? payload.deviceId : null;
  const _deviceLimit = Number.isFinite(payload.deviceLimit ?? NaN)
    ? Number(payload.deviceLimit)
    : null;

  let uploadedToStorage = false;

  try {
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
          let page: Awaited<ReturnType<typeof browser.newPage>> | null = null;

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

            await setContentWithNetworkIdleLogging(page, html, 'edge-pdf', logger);

            // Extract document title from HTML if possible
            const documentTitle = await page.title().catch(() => 'Offer Document');
            if (documentTitle) {
              await page.setTitle(documentTitle);
            }

            // Extract header/footer data for Puppeteer templates
            const headerFooterData = await page.evaluate(() => {
              const footer = document.querySelector('.slim-footer');
              const header = document.querySelector('.slim-header');

              if (!footer) return null;

              const companyEl = footer.querySelector('.slim-footer > div > span:first-child');
              const companyName = companyEl?.textContent?.trim() || 'Company';

              const addressEl = footer.querySelector('.slim-footer > div > span:nth-child(2)');
              const companyAddress = addressEl?.textContent?.trim() || '';

              const taxIdEl = footer.querySelector('.slim-footer > div > span:nth-child(3)');
              const companyTaxId = taxIdEl?.textContent?.trim() || '';

              const pageNumberEl = footer.querySelector('.slim-footer__page-number');
              const pageLabel = pageNumberEl?.getAttribute('data-page-label') || 'Page';

              let title = '';
              let issueDate = '';
              let dateLabel = '';

              if (header) {
                const titleEl = header.querySelector('.slim-header__title');
                title = titleEl?.textContent?.trim() || '';

                const metaEl = header.querySelector('.slim-header__meta');
                const metaText = metaEl?.textContent?.trim() || '';
                const dateMatch = metaText.match(/^(.+?):\s*(.+)$/);
                if (dateMatch) {
                  dateLabel = dateMatch[1]?.trim() || '';
                  issueDate = dateMatch[2]?.trim() || '';
                }
              }

              return {
                companyName,
                companyAddress,
                companyTaxId,
                pageLabel,
                title,
                issueDate,
                dateLabel,
              };
            });

            // Create footer template with page numbers (server-side)
            // Puppeteer templates support .pageNumber and .totalPages classes
            const footerTemplate = headerFooterData
              ? `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8pt; font-family: 'Work Sans', Arial, sans-serif; color: #334155; padding: 4mm 0; width: 100%; box-sizing: border-box;">
                <div style="display: flex; flex-direction: column; gap: 2px; font-size: 7pt; min-width: 0; flex: 1; max-width: 70%; word-wrap: break-word;">
                  <span style="font-weight: 600;">${escapeHtml(headerFooterData.companyName)}</span>
                  ${headerFooterData.companyAddress ? `<span>${escapeHtml(headerFooterData.companyAddress)}</span>` : ''}
                  ${headerFooterData.companyTaxId ? `<span>${escapeHtml(headerFooterData.companyTaxId)}</span>` : ''}
                </div>
                <span style="flex-shrink: 0; white-space: nowrap; font-variant-numeric: tabular-nums; letter-spacing: 0.06em; text-transform: uppercase;">
                  ${escapeHtml(headerFooterData.pageLabel)} <span class="pageNumber"></span> / <span class="totalPages"></span>
                </span>
              </div>
            `
              : '<div></div>';

            // Generate PDF with margins that account for header/footer templates
            // Using @page margins (20mm top, 15mm sides, 25mm bottom) plus space for templates
            return await page.pdf({
              format: 'A4',
              margin: { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' },
              printBackground: true,
              preferCSSPageSize: true,
              displayHeaderFooter: true,
              headerTemplate: '<div></div>', // Empty header for now
              footerTemplate: footerTemplate,
              scale: 1.0,
            });
          } finally {
            if (page) {
              try {
                await page.close();
              } catch (closeError) {
                logger.error('Failed to close Puppeteer page', closeError);
              }
            }
          }
        } finally {
          try {
            await browser.close();
          } catch (closeError) {
            logger.error('Failed to close Puppeteer browser', closeError);
          }
        }
      },
      JOB_TIMEOUT_MS,
      'PDF generation timed out',
    );

    const pdfBuffer = pdfBinary instanceof Uint8Array ? pdfBinary : new Uint8Array(pdfBinary);

    const upload = await supabase.storage.from('offers').upload(job.storage_path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    uploadedToStorage = true;

    const { data: publicUrlData } = supabase.storage.from('offers').getPublicUrl(job.storage_path);
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
        logger.error('PDF verification failed - file not accessible', undefined, {
          offerId: job.offer_id,
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
        logger.error('PDF verification failed - incorrect content type', undefined, {
          offerId: job.offer_id,
          pdfUrl,
          contentType,
        });
        throw new Error(`PDF has incorrect content type: ${contentType}`);
      }

      logger.info('Verified: PDF is accessible and downloadable', {
        offerId: job.offer_id,
        pdfUrl,
        contentType,
      });
    } catch (verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error('Failed to verify PDF accessibility', verifyError, {
        offerId: job.offer_id,
        pdfUrl,
      });
      throw new Error(`PDF is not accessible: ${errorMessage}`);
    }

    // Calculate processing duration
    const { data: jobWithStartTime } = await supabase
      .from('pdf_jobs')
      .select('started_at')
      .eq('id', jobId)
      .single();

    let processingDurationMs: number | null = null;
    if (jobWithStartTime?.started_at) {
      const startedAt = new Date(jobWithStartTime.started_at);
      const completedAt = new Date();
      processingDurationMs = completedAt.getTime() - startedAt.getTime();
    }

    // Use transactional function to atomically:
    // 1. Increment quota (checks limits for both user and device)
    // 2. Update offer with PDF URL
    // 3. Mark job as completed
    // All operations succeed or fail together
    logger.info('Completing PDF job transactionally', {
      jobId,
      offerId: job.offer_id,
      pdfUrl,
      processingDurationMs,
    });

    const { data: completionData, error: completionError } = await supabase.rpc(
      'complete_pdf_job_transactional',
      {
        p_job_id: jobId,
        p_pdf_url: pdfUrl,
        p_processing_duration_ms: processingDurationMs ?? null,
      },
    );

    if (completionError) {
      logger.error('Transactional job completion failed', completionError, {
        jobId,
      });
      throw new Error(completionError.message || 'Failed to complete PDF job');
    }

    const completionResult = Array.isArray(completionData) ? completionData[0] : completionData;
    if (!completionResult || !completionResult.success) {
      const errorMessage = completionResult?.error_message || 'Job completion failed';
      logger.error('PDF job completion failed transactionally', new Error(errorMessage), {
        jobId,
      });
      throw new Error(errorMessage);
    }

    logger.info('PDF job completed successfully via transactional function', {
      jobId,
      offerId: job.offer_id,
      pdfUrl,
    });

    if (job.callback_url && pdfUrl) {
      if (isPdfWebhookUrlAllowed(job.callback_url, pdfWebhookAllowlist)) {
        try {
          await fetch(job.callback_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId,
              offerId: job.offer_id,
              pdfUrl,
              downloadToken: job.download_token,
            }),
          });
        } catch (callbackError) {
          logger.error('Webhook error', callbackError);
        }
      } else {
        logger.warn('Skipping webhook dispatch for disallowed URL', {
          callbackUrl: job.callback_url,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        jobId,
        offerId: job.offer_id,
        pdfUrl,
        downloadToken: job.download_token,
      }),
      { headers: JSON_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (uploadedToStorage) {
      try {
        await supabase.storage.from('offers').remove([job.storage_path]);
      } catch (cleanupError) {
        logger.error('Failed to remove uploaded PDF after error', cleanupError);
      }
    }

    // Get current retry information from database
    const { data: jobForRetry } = await supabase
      .from('pdf_jobs')
      .select('retry_count, max_retries')
      .eq('id', jobId)
      .single();

    const currentRetryCount =
      typeof jobForRetry?.retry_count === 'number' ? jobForRetry.retry_count : 0;
    const maxRetries = typeof jobForRetry?.max_retries === 'number' ? jobForRetry.max_retries : 3;

    // Use transactional failure function to handle job failure with automatic quota rollback
    // This atomically: rolls back quota if incremented, clears offer PDF URL, and updates job status
    const failureLogger = createDenoLogger({ jobId, functionName: 'pdf-worker' });
    failureLogger.warn('Failing PDF job transactionally', {
      jobId,
      errorMessage: message,
      retryCount: currentRetryCount,
      maxRetries,
    });

    const { data: failureData, error: failureError } = await supabase.rpc(
      'fail_pdf_job_with_rollback',
      {
        p_job_id: jobId,
        p_error_message: message,
        p_retry_count: currentRetryCount,
        p_max_retries: maxRetries,
      },
    );

    if (failureError) {
      logger.error('Failed to process job failure transactionally', failureError, {
        jobId,
      });
      // Fallback to basic error handling if transactional failure processing fails
    } else {
      const failureResult = Array.isArray(failureData) ? failureData[0] : failureData;
      if (!failureResult || !failureResult.success) {
        failureLogger.error(
          'Transactional job failure processing failed',
          new Error(failureResult?.error_message || 'Unknown error'),
          { jobId },
        );
      } else {
        failureLogger.info('Job failure processed transactionally', {
          jobId,
          shouldRetry: failureResult.should_retry,
          nextRetryAt: failureResult.next_retry_at,
        });
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status: 500,
    });
  }
});

async function claimJobForProcessing(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ claimed: boolean; reason?: string }> {
  // First check concurrent job limit for the user
  const { data: jobInfo } = await supabase
    .from('pdf_jobs')
    .select('user_id')
    .eq('id', jobId)
    .single();

  if (jobInfo?.user_id) {
    // Check concurrent limit (default: 3, but could be configured per user)
    const { data: concurrentCheck } = await supabase.rpc('check_concurrent_job_limit', {
      user_id_param: jobInfo.user_id,
      max_concurrent: 3, // Default limit, could be made configurable per plan
    });

    if (concurrentCheck === false) {
      return {
        claimed: false,
        reason: 'User has reached maximum concurrent job limit',
      };
    }
  }

  // Try to claim as pending job first
  let { data, error } = await supabase
    .from('pdf_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      error_message: null,
      first_attempted_at: new Date().toISOString(), // Track when first attempt started
    })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  if (data) {
    return { claimed: true };
  }

  // If not pending, try to claim as retry job (failed status, ready for retry)
  const now = new Date().toISOString();
  ({ data, error } = await supabase
    .from('pdf_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      error_message: null,
      next_retry_at: null, // Clear retry schedule
    })
    .eq('id', jobId)
    .eq('status', 'failed')
    .lte('next_retry_at', now) // Only claim if retry time has passed
    .select('id')
    .maybeSingle());

  if (error) {
    throw new Error(`Failed to claim retry job: ${error.message}`);
  }

  return { claimed: Boolean(data) };
}

async function finalizeJobFailure(
  supabase: SupabaseClient,
  jobId: string,
  message: string,
  currentRetryCount: number = 0,
  maxRetries: number = 3,
) {
  const errorMessage = message || 'Unknown error occurred';

  // Check if error is retryable
  const isRetryable =
    !errorMessage.toLowerCase().includes('invalid') &&
    !errorMessage.toLowerCase().includes('validation') &&
    !errorMessage.toLowerCase().includes('permission denied') &&
    !errorMessage.toLowerCase().includes('quota exceeded') &&
    !errorMessage.toLowerCase().includes('unauthorized') &&
    !errorMessage.toLowerCase().includes('forbidden') &&
    !errorMessage.toLowerCase().includes('not found') &&
    !errorMessage.toLowerCase().includes('malformed') &&
    !errorMessage.toLowerCase().includes('bad request');

  const newRetryCount = currentRetryCount + 1;

  if (isRetryable && newRetryCount < maxRetries) {
    // Schedule retry using exponential backoff
    const baseDelaySeconds = 60; // 1 minute
    const maxDelaySeconds = 3600; // 1 hour
    const exponentialDelay = Math.min(
      baseDelaySeconds * Math.pow(2, newRetryCount),
      maxDelaySeconds,
    );
    const jitter = Math.floor(Math.random() * exponentialDelay * 0.2);
    const delaySeconds = exponentialDelay + jitter;

    const nextRetryAt = new Date();
    nextRetryAt.setSeconds(nextRetryAt.getSeconds() + delaySeconds);

    const retryLogger = log ?? createDenoLogger({ jobId, functionName: 'pdf-worker' });
    retryLogger.warn('PDF job failed, scheduling retry', {
      jobId,
      retryCount: newRetryCount,
      maxRetries,
      nextRetryAt: nextRetryAt.toISOString(),
      delaySeconds,
    });

    const { error } = await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt.toISOString(),
        last_retry_error: errorMessage,
        started_at: null, // Reset so job can be picked up again
        error_message: errorMessage,
      })
      .eq('id', jobId);

    if (error) {
      retryLogger.error('Failed to schedule job retry', error, { jobId });
    }
  } else {
    // Move to Dead Letter Queue or mark as permanently failed
    const dlqLogger = log ?? createDenoLogger({ jobId, functionName: 'pdf-worker' });
    if (newRetryCount >= maxRetries) {
      dlqLogger.error('PDF job exceeded max retries, moving to Dead Letter Queue', undefined, {
        jobId,
        retryCount: newRetryCount,
        maxRetries,
      });

      // Try to use the database function first
      const { error: dlqError } = await supabase.rpc('move_job_to_dead_letter_queue', {
        job_id: jobId,
        reason: `Exceeded max retries (${newRetryCount}/${maxRetries}). Last error: ${errorMessage}`,
      });

      if (dlqError) {
        // Fallback: Update directly
        logger.warn('DLQ function failed, updating directly', { jobId, dlqError });
        const { error: updateError } = await supabase
          .from('pdf_jobs')
          .update({
            status: 'dead_letter',
            error_message: `Exceeded max retries. Last error: ${errorMessage}`,
            completed_at: new Date().toISOString(),
            next_retry_at: null,
            retry_count: newRetryCount,
          })
          .eq('id', jobId);

        if (updateError) {
          logger.error('Failed to move job to Dead Letter Queue', updateError, { jobId });
        }
      }
    } else {
      // Non-retryable error - mark as permanently failed (move to DLQ)
      logger.error(
        'PDF job failed with non-retryable error, moving to Dead Letter Queue',
        undefined,
        {
          jobId,
          error: errorMessage,
        },
      );

      const { error: dlqError } = await supabase.rpc('move_job_to_dead_letter_queue', {
        job_id: jobId,
        reason: `Non-retryable error: ${errorMessage}`,
      });

      if (dlqError) {
        // Fallback: Update directly
        const { error: updateError } = await supabase
          .from('pdf_jobs')
          .update({
            status: 'dead_letter',
            error_message: `Non-retryable error: ${errorMessage}`,
            completed_at: new Date().toISOString(),
            next_retry_at: null,
          })
          .eq('id', jobId);

        if (updateError) {
          logger.error('Failed to move non-retryable job to Dead Letter Queue', updateError, {
            jobId,
          });
        }
      }
    }
  }
}

type CounterKind = 'user' | 'device';

type CounterTargets = {
  user: { userId: string };
  device: { userId: string; deviceId: string };
};

type UsageConfig<K extends CounterKind> = {
  table: string;
  columnMap: { [P in keyof CounterTargets[K]]: string };
  rpc: 'check_and_increment_usage' | 'check_and_increment_device_usage';
};

const COUNTER_CONFIG: { [K in CounterKind]: UsageConfig<K> } = {
  user: {
    table: 'usage_counters',
    columnMap: { userId: 'user_id' },
    rpc: 'check_and_increment_usage',
  },
  device: {
    table: 'device_usage_counters',
    columnMap: { userId: 'user_id', deviceId: 'device_id' },
    rpc: 'check_and_increment_device_usage',
  },
};

async function rollbackUsageIncrementForKind<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
): Promise<void> {
  const config = COUNTER_CONFIG[kind];
  const normalizedExpected = normalizeDate(expectedPeriod, expectedPeriod);

  const buildQuery = () => {
    let builder = supabase.from(config.table).select('offers_generated, period_start');
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        builder = builder.eq(column, target[key]);
      },
    );
    return builder;
  };

  const { data: existing, error } = await buildQuery().maybeSingle();
  if (error) {
    throw new Error(`Failed to load usage counter for rollback: ${error.message}`);
  }

  const rollbackLogger = createDenoLogger({ functionName: 'pdf-worker-rollback' });
  if (!existing) {
    rollbackLogger.warn('Usage rollback skipped: counter not found', {
      kind,
      target,
      expectedPeriod: normalizedExpected,
    });
    return;
  }

  let record = existing;
  let periodStart = normalizeDate(record.period_start, normalizedExpected);

  if (periodStart !== normalizedExpected) {
    let normalizedQuery = buildQuery();
    normalizedQuery = normalizedQuery.eq('period_start', normalizedExpected);
    const { data: normalizedRow, error: normalizedError } = await normalizedQuery.maybeSingle();

    if (normalizedError) {
      throw new Error(
        `Failed to load normalized usage counter for rollback: ${normalizedError.message}`,
      );
    }

    if (!normalizedRow) {
      rollbackLogger.warn('Usage rollback skipped: period mismatch', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        foundPeriod: periodStart,
      });
      return;
    }

    record = normalizedRow;
    periodStart = normalizeDate(record.period_start, normalizedExpected);

    if (periodStart !== normalizedExpected) {
      rollbackLogger.warn('Usage rollback skipped: period mismatch', {
        kind,
        target,
        expectedPeriod: normalizedExpected,
        foundPeriod: periodStart,
      });
      return;
    }
  }

  const currentCount = Number(record.offers_generated ?? 0);
  if (currentCount <= 0) {
    rollbackLogger.warn('Usage rollback skipped: non-positive counter', {
      kind,
      target,
      expectedPeriod: normalizedExpected,
      offersGenerated: currentCount,
    });
    return;
  }

  let updateBuilder = supabase
    .from(config.table)
    .update({ offers_generated: currentCount - 1, period_start: normalizedExpected });
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    },
  );

  updateBuilder = updateBuilder.eq('period_start', record.period_start ?? normalizedExpected);

  const { error: updateError } = await updateBuilder;
  if (updateError) {
    throw new Error(`Failed to rollback usage counter increment: ${updateError.message}`);
  }
}

async function rollbackUsageIncrementWithRetry<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
  maxRetries: number = 3,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rollbackUsageIncrementForKind(supabase, kind, target, expectedPeriod);
      const retryLogger = createDenoLogger({ functionName: 'pdf-worker-rollback' });
      if (attempt > 0) {
        retryLogger.info(`Rollback succeeded on attempt ${attempt + 1}`, {
          kind,
          target,
          expectedPeriod,
        });
      }
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryLogger = createDenoLogger({ functionName: 'pdf-worker-rollback' });

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delayMs = 100 * Math.pow(2, attempt);
        retryLogger.warn(`Rollback attempt ${attempt + 1} failed, retrying in ${delayMs}ms`, {
          kind,
          target,
          expectedPeriod,
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  // All retries failed - log but don't throw to prevent cascading failures
  const finalLogger = createDenoLogger({ functionName: 'pdf-worker-rollback' });
  finalLogger.error(`Failed to rollback usage increment after ${maxRetries} attempts`, lastError, {
    kind,
    target,
    expectedPeriod,
  });
}

export async function rollbackUsageIncrement<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
) {
  return rollbackUsageIncrementWithRetry(supabase, kind, target, expectedPeriod);
}

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

async function ensureUsageCounter<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  periodStart: string,
): Promise<{ periodStart: string; offersGenerated: number }> {
  const config = COUNTER_CONFIG[kind];
  let selectBuilder = supabase.from(config.table).select('period_start, offers_generated');
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      selectBuilder = selectBuilder.eq(column, target[key]);
    },
  );
  const { data: existing, error: selectError } = await selectBuilder.maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Failed to load usage counter: ${selectError.message}`);
  }

  let usageRow = existing;
  if (!usageRow) {
    const insertPayload: Record<string, unknown> = {
      period_start: periodStart,
      offers_generated: 0,
    };
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        insertPayload[column] = target[key];
      },
    );
    const { data: inserted, error: insertError } = await supabase
      .from(config.table)
      .insert(insertPayload)
      .select('period_start, offers_generated')
      .maybeSingle();
    if (insertError) {
      throw new Error(`Failed to initialise usage counter: ${insertError.message}`);
    }
    usageRow = inserted ?? { period_start: periodStart, offers_generated: 0 };
  }

  let currentPeriod = normalizeDate(usageRow?.period_start, periodStart);
  let generated = Number(usageRow?.offers_generated ?? 0);

  if (currentPeriod !== periodStart) {
    let updateBuilder = supabase
      .from(config.table)
      .update({ period_start: periodStart, offers_generated: 0 });
    (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
      ([key, column]) => {
        updateBuilder = updateBuilder.eq(column, target[key]);
      },
    );
    const { data: resetRow, error: resetError } = await updateBuilder
      .select('period_start, offers_generated')
      .maybeSingle();
    if (resetError) {
      throw new Error(`Failed to reset usage counter: ${resetError.message}`);
    }
    currentPeriod = normalizeDate(resetRow?.period_start, periodStart);
    generated = Number(resetRow?.offers_generated ?? 0);
  }

  return { periodStart: currentPeriod, offersGenerated: generated };
}

async function fallbackIncrement<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string,
) {
  const config = COUNTER_CONFIG[kind];
  const state = await ensureUsageCounter(supabase, kind, target, periodStart);

  if (typeof limit === 'number' && Number.isFinite(limit) && state.offersGenerated >= limit) {
    return {
      allowed: false,
      offersGenerated: state.offersGenerated,
      periodStart: state.periodStart,
    };
  }

  let updateBuilder = supabase
    .from(config.table)
    .update({ offers_generated: state.offersGenerated + 1, period_start: state.periodStart });
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    },
  );
  const { data: updatedRow, error: updateError } = await updateBuilder
    .select('period_start, offers_generated')
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to bump usage counter: ${updateError.message}`);
  }

  const period = normalizeDate(updatedRow?.period_start, state.periodStart);
  const offersGenerated = Number(updatedRow?.offers_generated ?? state.offersGenerated + 1);
  return { allowed: true, offersGenerated, periodStart: period };
}

export async function incrementUsage<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  limit: number | null,
  periodStart: string,
  excludeJobId?: string | null,
) {
  const config = COUNTER_CONFIG[kind];
  const normalizedLimit = Number.isFinite(limit ?? NaN) ? Number(limit) : null;

  if (normalizedLimit === null) {
    return fallbackIncrement(supabase, kind, target, null, periodStart);
  }

  const rpcPayload =
    kind === 'user'
      ? {
          p_user_id: target.userId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
          p_exclude_job_id: excludeJobId || null,
        }
      : {
          p_user_id: target.userId,
          p_device_id: (target as CounterTargets['device']).deviceId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
          p_exclude_job_id: excludeJobId || null,
        };

  const quotaLogger = createDenoLogger({ functionName: 'pdf-worker-quota' });
  quotaLogger.info('Calling quota increment RPC', {
    rpc: config.rpc,
    kind,
    target,
    limit: normalizedLimit,
    periodStart,
    excludeJobId,
    payload: rpcPayload,
  });

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload as Record<string, unknown>);
  if (error) {
    const message = error.message ?? '';
    const details = error.details ?? '';
    const combined = `${message} ${details}`.toLowerCase();

    quotaLogger.error('Quota increment RPC error', new Error(message), {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      periodStart,
      details,
      code: (error as { code?: string }).code,
      hint: (error as { hint?: string }).hint,
    });

    if (
      combined.includes(config.rpc) ||
      combined.includes('multiple function variants') ||
      combined.includes('could not find function')
    ) {
      quotaLogger.warn('Falling back to non-RPC increment due to RPC function error', {
        rpc: config.rpc,
        kind,
        target,
      });
      return fallbackIncrement(supabase, kind, target, normalizedLimit, periodStart);
    }
    throw new Error(`Failed to update usage counter: ${message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  const incrementResult = {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };

  quotaLogger.info('Quota increment RPC result', {
    rpc: config.rpc,
    kind,
    target,
    result: incrementResult,
  });

  if (!incrementResult.allowed) {
    quotaLogger.warn('Quota increment not allowed', {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      currentUsage: incrementResult.offersGenerated,
      periodStart: incrementResult.periodStart,
    });
  }

  return incrementResult;
}

type PdfJobPayload = {
  html: string;
  usagePeriodStart?: string | null;
  userLimit?: number | null;
  deviceId?: string | null;
  deviceLimit?: number | null;
  templateId?: string | null;
  metadata?: Record<string, unknown> | null;
};
