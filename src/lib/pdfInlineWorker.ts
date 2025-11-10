import type { SupabaseClient } from '@supabase/supabase-js';
import type { HTTPRequest, HTTPResponse, Page } from 'puppeteer';

import type { PdfJobInput } from '@/lib/queue/pdf';
import { renderRuntimePdfHtml } from '@/lib/pdfRuntime';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { incrementUsage, rollbackUsageIncrement } from '@/lib/usageHelpers';
import {
  createPdfOptions,
  toPuppeteerOptions,
  setPdfMetadata,
  type PdfMetadata,
  type PuppeteerPage,
} from '@/lib/pdfConfig';

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
    console.error(`[${context}] page.setContent failed while waiting for networkidle0`, error);
    throw error;
  } finally {
    detachPageListener(page, 'requestfailed', onRequestFailed as PageEventHandler);
    detachPageListener(page, 'response', onResponse as PageEventHandler);

    const elapsed = Date.now() - startedAt;
    console.info(`[${context}] page.setContent(waitUntil=networkidle0) completed in ${elapsed}ms`);

    if (requestFailures.length > 0) {
      console.warn(
        `[${context}] ${requestFailures.length} request(s) failed while loading PDF content`,
        requestFailures,
      );
    }

    if (responseErrors.length > 0) {
      console.warn(
        `[${context}] ${responseErrors.length} response(s) returned error status while loading PDF content`,
        responseErrors,
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
  let userUsageIncremented = false;
  let deviceUsageIncremented = false;

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

            // Extract header/footer data for Puppeteer templates
            const headerFooterData = await page.evaluate(() => {
              const footer = document.querySelector('.slim-footer');

              if (!footer) return null;

              const companyEl = footer.querySelector('.slim-footer > div > span:first-child');
              const companyName = companyEl?.textContent?.trim() || 'Company';

              const addressEl = footer.querySelector('.slim-footer > div > span:nth-child(2)');
              const companyAddress = addressEl?.textContent?.trim() || '';

              const taxIdEl = footer.querySelector('.slim-footer > div > span:nth-child(3)');
              const companyTaxId = taxIdEl?.textContent?.trim() || '';

              const pageNumberEl = footer.querySelector('.slim-footer__page-number');
              const pageLabel = pageNumberEl?.getAttribute('data-page-label') || 'Page';

              return { companyName, companyAddress, companyTaxId, pageLabel };
            });

            // Create footer template with page numbers (server-side)
            // Puppeteer templates support .pageNumber and .totalPages classes
            function escapeHtml(text: string): string {
              return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            }

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

            // Generate PDF with margins and Puppeteer templates for page numbers
            const pdfOptions = createPdfOptions(pdfMetadata, {
              margin: {
                top: '20mm',
                right: '15mm',
                bottom: '25mm',
                left: '15mm',
              },
              displayHeaderFooter: true,
              headerTemplate: '<div></div>', // Empty header for now
              footerTemplate: footerTemplate,
            });

            const puppeteerOptions = toPuppeteerOptions(pdfOptions);
            return await page.pdf(puppeteerOptions as Parameters<Page['pdf']>[0]);
          } finally {
            if (page) {
              try {
                await page.close();
              } catch (closeError) {
                console.error('Failed to close Puppeteer page (inline worker):', closeError);
              }
            }
          }
        } finally {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('Failed to close Puppeteer browser (inline worker):', closeError);
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

    // Update offer FIRST, then increment quota
    // This ensures quota is only incremented if offer update succeeds
    // Reduces window for quota leaks if offer update fails
    const { data: updatedOffer, error: offerUpdateError } = await supabase
      .from('offers')
      .update({ pdf_url: pdfUrl })
      .eq('id', job.offerId)
      .eq('user_id', job.userId)
      .select('id, pdf_url')
      .single();

    if (offerUpdateError) {
      throw new Error(`Failed to update offer with PDF URL: ${offerUpdateError.message}`);
    }

    if (!updatedOffer || updatedOffer.pdf_url !== pdfUrl) {
      console.error('Offer update verification failed', {
        offerId: job.offerId,
        expectedPdfUrl: pdfUrl,
        actualPdfUrl: updatedOffer?.pdf_url,
      });
      throw new Error('Offer update verification failed - PDF URL was not set correctly');
    }

    console.log('Offer updated successfully with PDF URL', {
      offerId: job.offerId,
      pdfUrl,
    });

    // Double-check the update persisted by querying again
    const { data: doubleCheck, error: doubleCheckError } = await supabase
      .from('offers')
      .select('id, pdf_url')
      .eq('id', job.offerId)
      .eq('user_id', job.userId)
      .maybeSingle();

    if (doubleCheckError) {
      console.error('Double-check query failed', { error: doubleCheckError });
    } else if (!doubleCheck || doubleCheck.pdf_url !== pdfUrl) {
      console.error('CRITICAL: Offer update did not persist!', {
        offerId: job.offerId,
        expectedPdfUrl: pdfUrl,
        actualPdfUrl: doubleCheck?.pdf_url,
      });
      throw new Error('Offer update did not persist in database');
    } else {
      console.log('Verified: Offer update persisted correctly', {
        offerId: job.offerId,
        pdfUrl: doubleCheck.pdf_url,
      });
    }

    // Verify PDF is actually downloadable before incrementing quota
    // This ensures quota is only incremented when PDF is accessible to users
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
        console.error('PDF verification failed - file not accessible', {
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
        console.error('PDF verification failed - incorrect content type', {
          offerId: job.offerId,
          pdfUrl,
          contentType,
        });
        throw new Error(`PDF has incorrect content type: ${contentType}`);
      }

      console.log('Verified: PDF is accessible and downloadable', {
        offerId: job.offerId,
        pdfUrl,
        contentType,
      });
    } catch (verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      console.error('Failed to verify PDF accessibility', {
        offerId: job.offerId,
        pdfUrl,
        error: errorMessage,
      });
      // Rollback offer update since PDF is not accessible
      await supabase
        .from('offers')
        .update({ pdf_url: null })
        .eq('id', job.offerId)
        .eq('user_id', job.userId);
      throw new Error(`PDF is not accessible: ${errorMessage}`);
    }

    // Increment quota ONLY after PDF is verified as accessible and downloadable
    // If this fails, we can rollback the offer update if needed
    console.log('Attempting to increment user quota', {
      userId: job.userId,
      limit: job.userLimit,
      periodStart: job.usagePeriodStart,
    });

    const usageResult = await incrementUsage(
      supabase,
      'user',
      { userId: job.userId },
      job.userLimit,
      job.usagePeriodStart,
      job.jobId, // Exclude this job from pending count
    );

    console.log('User quota increment result', {
      allowed: usageResult.allowed,
      offersGenerated: usageResult.offersGenerated,
      periodStart: usageResult.periodStart,
    });

    if (!usageResult.allowed) {
      console.error('User quota increment not allowed, rolling back offer update', {
        userId: job.userId,
        offersGenerated: usageResult.offersGenerated,
        limit: job.userLimit,
      });
      // Rollback offer update if quota check fails
      await supabase
        .from('offers')
        .update({ pdf_url: null })
        .eq('id', job.offerId)
        .eq('user_id', job.userId);
      throw new Error('A havi ajánlatlimitálás túllépése miatt nem készíthető új PDF.');
    }
    userUsageIncremented = true;
    console.log('User quota incremented successfully', {
      userId: job.userId,
      newUsage: usageResult.offersGenerated,
    });

    if (job.deviceId && job.deviceLimit != null) {
      console.log('Attempting to increment device quota', {
        userId: job.userId,
        deviceId: job.deviceId,
        limit: job.deviceLimit,
        periodStart: job.usagePeriodStart,
      });

      const deviceResult = await incrementUsage(
        supabase,
        'device',
        { userId: job.userId, deviceId: job.deviceId },
        job.deviceLimit ?? null,
        job.usagePeriodStart,
        job.jobId, // Exclude this job from pending count
      );

      console.log('Device quota increment result', {
        allowed: deviceResult.allowed,
        offersGenerated: deviceResult.offersGenerated,
        periodStart: deviceResult.periodStart,
      });

      if (!deviceResult.allowed) {
        console.error('Device quota increment not allowed, rolling back', {
          userId: job.userId,
          deviceId: job.deviceId,
          offersGenerated: deviceResult.offersGenerated,
          limit: job.deviceLimit,
        });
        // Rollback user quota and offer update if device quota check fails
        await rollbackUsageIncrement(supabase, job.userId, job.usagePeriodStart);
        await supabase
          .from('offers')
          .update({ pdf_url: null })
          .eq('id', job.offerId)
          .eq('user_id', job.userId);
        throw new Error('Az eszközön elérted a havi ajánlatlimitálást.');
      }
      deviceUsageIncremented = true;
      console.log('Device quota incremented successfully', {
        userId: job.userId,
        deviceId: job.deviceId,
        newUsage: deviceResult.offersGenerated,
      });
    }

    // Mark job as completed BEFORE returning
    // If this fails, quota is already incremented, so we need to handle this carefully
    const { error: jobCompleteError } = await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pdf_url: pdfUrl,
      })
      .eq('id', job.jobId);
    if (jobCompleteError) {
      // Job completion failed, but quota was already incremented
      // This is a critical error - log it but don't rollback quota since PDF is accessible
      console.error('CRITICAL: Failed to mark job as completed after quota increment', {
        jobId: job.jobId,
        offerId: job.offerId,
        error: jobCompleteError.message,
        pdfUrl,
      });
      // Don't throw - quota is incremented and PDF is accessible, so this is a data consistency issue
      // but the user should still have access to their PDF
      // The job status will remain 'processing', which is acceptable
    }

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
          console.error('Webhook error (inline worker):', callbackError);
        }
      } else {
        console.warn(
          'Skipping webhook dispatch for disallowed URL (inline worker):',
          job.callbackUrl,
        );
      }
    }

    console.log('PDF job completed successfully', {
      jobId: job.jobId,
      offerId: job.offerId,
      pdfUrl,
      userUsageIncremented,
      deviceUsageIncremented,
    });

    return pdfUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (uploadedToStorage) {
      try {
        await supabase.storage.from('offers').remove([job.storagePath]);
      } catch (cleanupError) {
        console.error('Failed to remove uploaded PDF after inline worker error:', cleanupError);
      }
    }

    // Rollback quota increments if error occurred after quota was incremented
    if (userUsageIncremented || deviceUsageIncremented) {
      // Also rollback offer update since quota was incremented but job failed
      try {
        await supabase
          .from('offers')
          .update({ pdf_url: null })
          .eq('id', job.offerId)
          .eq('user_id', job.userId);
      } catch (offerRollbackError) {
        console.error('Failed to rollback offer update (inline worker):', offerRollbackError);
      }
    }

    if (userUsageIncremented) {
      try {
        await rollbackUsageIncrement(supabase, job.userId, job.usagePeriodStart);
      } catch (rollbackError) {
        console.error('Failed to rollback user usage increment (inline worker):', rollbackError);
      }
    }

    if (deviceUsageIncremented && job.deviceId) {
      try {
        await rollbackUsageIncrement(supabase, job.userId, job.usagePeriodStart, {
          deviceId: job.deviceId,
        });
      } catch (rollbackError) {
        console.error('Failed to rollback device usage increment (inline worker):', rollbackError);
      }
    }

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', job.jobId);

    throw error instanceof Error ? error : new Error(message);
  }
}
