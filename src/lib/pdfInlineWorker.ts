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
    detachPageListener(page, 'requestfailed', onRequestFailed);
    detachPageListener(page, 'response', onResponse);

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

export async function processPdfJobInline(
  supabase: SupabaseClient,
  job: PdfJobInput,
): Promise<string | null> {
  const startedAt = new Date().toISOString();
  await supabase
    .from('pdf_jobs')
    .update({ status: 'processing', started_at: startedAt })
    .eq('id', job.jobId);

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
            await setPdfMetadata(page, pdfMetadata);
            
            // Generate PDF with professional settings
            const pdfOptions = createPdfOptions(pdfMetadata);
            return await page.pdf(toPuppeteerOptions(pdfOptions));
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

    const usageResult = await incrementUsage(
      supabase,
      'user',
      { userId: job.userId },
      job.userLimit,
      job.usagePeriodStart,
    );
    if (!usageResult.allowed) {
      throw new Error('A havi ajánlatlimitálás túllépése miatt nem készíthető új PDF.');
    }
    userUsageIncremented = true;

    if (job.deviceId && job.deviceLimit != null) {
      const deviceResult = await incrementUsage(
        supabase,
        'device',
        { userId: job.userId, deviceId: job.deviceId },
        job.deviceLimit ?? null,
        job.usagePeriodStart,
      );
      if (!deviceResult.allowed) {
        throw new Error('Az eszközön elérted a havi ajánlatlimitálást.');
      }
      deviceUsageIncremented = true;
    }

    await supabase
      .from('offers')
      .update({ pdf_url: pdfUrl })
      .eq('id', job.offerId)
      .eq('user_id', job.userId);

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pdf_url: pdfUrl,
      })
      .eq('id', job.jobId);

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
