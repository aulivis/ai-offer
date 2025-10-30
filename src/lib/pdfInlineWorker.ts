import type { SupabaseClient } from '@supabase/supabase-js';
import type { Page } from 'puppeteer';

import type { PdfJobInput } from '@/lib/queue/pdf';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { incrementUsage, rollbackUsageIncrement } from '@/lib/usageHelpers';

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

    assertPdfEngineHtml(job.html, 'Inline PDF job HTML');

    const pdfBinary = await withTimeout(
      async () => {
        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
        });

        try {
          let page: Page | null = null;

          try {
            page = await browser.newPage();
            page.setDefaultNavigationTimeout(JOB_TIMEOUT_MS);
            page.setDefaultTimeout(JOB_TIMEOUT_MS);
            await page.setContent(job.html, { waitUntil: 'networkidle0' });
            return await page.pdf({
              format: 'A4',
              printBackground: true,
              preferCSSPageSize: true,
              margin: {
                top: '24mm',
                right: '16mm',
                bottom: '24mm',
                left: '16mm',
              },
            });
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
