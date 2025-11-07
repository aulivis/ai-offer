import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
import {
  createPdfWebhookAllowlist,
  isPdfWebhookUrlAllowed,
  splitAllowlist,
} from '../../shared/pdfWebhook.ts';
import { assertPdfEngineHtml } from '../../shared/pdfHtmlSignature.ts';
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

  if (job.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Job already processed' }), {
      headers: JSON_HEADERS,
      status: 409,
    });
  }

  const payload = (job.payload ?? {}) as PdfJobPayload;
  const html = typeof payload.html === 'string' && payload.html ? payload.html : '';
  if (!html) {
    await finalizeJobFailure(supabase, jobId, 'Job payload missing HTML');
    return new Response(JSON.stringify({ error: 'Job payload missing HTML' }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  try {
    assertPdfEngineHtml(html, 'PDF job payload HTML');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF job payload failed validation.';
    await finalizeJobFailure(supabase, jobId, message);
    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status: 400,
    });
  }

  let claimedProcessing = false;
  try {
    claimedProcessing = await claimJobForProcessing(supabase, jobId);
  } catch (statusError) {
    console.error('Failed to update PDF job status to processing:', statusError);
    return new Response(JSON.stringify({ error: 'Failed to update job status' }), {
      headers: JSON_HEADERS,
      status: 500,
    });
  }

  if (!claimedProcessing) {
    return new Response(JSON.stringify({ error: 'Job already processed' }), {
      headers: JSON_HEADERS,
      status: 409,
    });
  }

  const payloadPeriodStart =
    typeof payload.usagePeriodStart === 'string' && payload.usagePeriodStart
      ? payload.usagePeriodStart
      : null;
  const usagePeriodStart = normalizeDate(
    payloadPeriodStart,
    new Date(job.created_at ?? new Date()).toISOString().slice(0, 10),
  );
  // The billing window must be deterministic: prefer the payload-provided period
  // start and only fall back to the job timestamp when the payload omits it.
  const userLimit = Number.isFinite(payload.userLimit ?? NaN) ? Number(payload.userLimit) : null;
  const deviceId =
    typeof payload.deviceId === 'string' && payload.deviceId ? payload.deviceId : null;
  const deviceLimit = Number.isFinite(payload.deviceLimit ?? NaN)
    ? Number(payload.deviceLimit)
    : null;

  let uploadedToStorage = false;
  let userUsageIncremented = false;
  let deviceUsageIncremented = false;

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
            
            await setContentWithNetworkIdleLogging(page, html, 'edge-pdf');
            
            // Extract document title from HTML if possible
            const documentTitle = await page.title().catch(() => 'Offer Document');
            if (documentTitle) {
              await page.setTitle(documentTitle);
            }
            
            // Generate PDF with professional settings (A4 with 15mm side margins, 20mm top/bottom for headers/footers)
            return await page.pdf({
              format: 'A4',
              margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
              printBackground: true,
              preferCSSPageSize: true,
              displayHeaderFooter: false,
              scale: 1.0,
            });
          } finally {
            if (page) {
              try {
                await page.close();
              } catch (closeError) {
                console.error('Failed to close Puppeteer page (edge worker):', closeError);
              }
            }
          }
        } finally {
          try {
            await browser.close();
          } catch (closeError) {
            console.error('Failed to close Puppeteer browser (edge worker):', closeError);
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

    // Update offer FIRST, then increment quota
    // This ensures quota is only incremented if offer update succeeds
    // Reduces window for quota leaks if offer update fails
    const { error: offerUpdateError } = await supabase
      .from('offers')
      .update({ pdf_url: pdfUrl })
      .eq('id', job.offer_id)
      .eq('user_id', job.user_id);
    if (offerUpdateError) {
      throw new Error(`Failed to update offer with PDF URL: ${offerUpdateError.message}`);
    }

    // Increment quota AFTER offer update succeeds
    // If this fails, we can rollback the offer update if needed
    console.log('Attempting to increment user quota (edge worker)', {
      userId: job.user_id,
      limit: userLimit,
      periodStart: usagePeriodStart,
      offerId: job.offer_id,
    });
    
    const usageResult = await incrementUsage(
      supabase,
      'user',
      { userId: job.user_id },
      userLimit,
      usagePeriodStart,
    );
    
    console.log('User quota increment result (edge worker)', {
      userId: job.user_id,
      allowed: usageResult.allowed,
      offersGenerated: usageResult.offersGenerated,
      periodStart: usageResult.periodStart,
      limit: userLimit,
    });
    
    if (!usageResult.allowed) {
      console.error('User quota increment not allowed (edge worker), rolling back offer update', {
        userId: job.user_id,
        offersGenerated: usageResult.offersGenerated,
        limit: userLimit,
        offerId: job.offer_id,
      });
      // Rollback offer update if quota check fails
      await supabase
        .from('offers')
        .update({ pdf_url: null })
        .eq('id', job.offer_id)
        .eq('user_id', job.user_id);
      throw new Error('A havi ajánlatlimitálás túllépése miatt nem készíthető új PDF.');
    }
    userUsageIncremented = true;
    console.log('User quota incremented successfully (edge worker)', {
      userId: job.user_id,
      newUsage: usageResult.offersGenerated,
      offerId: job.offer_id,
    });

    if (deviceId && deviceLimit !== null) {
      console.log('Attempting to increment device quota (edge worker)', {
        userId: job.user_id,
        deviceId,
        limit: deviceLimit,
        periodStart: usagePeriodStart,
        offerId: job.offer_id,
      });
      
      const deviceResult = await incrementUsage(
        supabase,
        'device',
        { userId: job.user_id, deviceId },
        deviceLimit,
        usagePeriodStart,
      );
      
      console.log('Device quota increment result (edge worker)', {
        userId: job.user_id,
        deviceId,
        allowed: deviceResult.allowed,
        offersGenerated: deviceResult.offersGenerated,
        periodStart: deviceResult.periodStart,
        limit: deviceLimit,
      });
      
      if (!deviceResult.allowed) {
        console.error('Device quota increment not allowed (edge worker), rolling back', {
          userId: job.user_id,
          deviceId,
          offersGenerated: deviceResult.offersGenerated,
          limit: deviceLimit,
          offerId: job.offer_id,
        });
        // Rollback user quota and offer update if device quota check fails
        await rollbackUsageIncrement(supabase, 'user', { userId: job.user_id }, usagePeriodStart);
        await supabase
          .from('offers')
          .update({ pdf_url: null })
          .eq('id', job.offer_id)
          .eq('user_id', job.user_id);
        throw new Error('Az eszközön elérted a havi ajánlatlimitálást.');
      }
      deviceUsageIncremented = true;
      console.log('Device quota incremented successfully (edge worker)', {
        userId: job.user_id,
        deviceId,
        newUsage: deviceResult.offersGenerated,
        offerId: job.offer_id,
      });
    }

    const { error: jobCompleteError } = await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pdf_url: pdfUrl,
        error_message: null,
      })
      .eq('id', jobId);
    if (jobCompleteError) {
      throw new Error(`Failed to mark job as completed: ${jobCompleteError.message}`);
    }

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
          console.error('Webhook error:', callbackError);
        }
      } else {
        console.warn('Skipping webhook dispatch for disallowed URL:', job.callback_url);
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
        console.error('Failed to remove uploaded PDF after error:', cleanupError);
      }
    }

    // Rollback quota increments if error occurred after quota was incremented
    if (userUsageIncremented || deviceUsageIncremented) {
      // Also rollback offer update since quota was incremented but job failed
      try {
        await supabase
          .from('offers')
          .update({ pdf_url: null })
          .eq('id', job.offer_id)
          .eq('user_id', job.user_id);
      } catch (offerRollbackError) {
        console.error('Failed to rollback offer update:', offerRollbackError);
      }
    }

    if (userUsageIncremented) {
      try {
        await rollbackUsageIncrement(supabase, 'user', { userId: job.user_id }, usagePeriodStart);
      } catch (rollbackError) {
        console.error('Failed to rollback user usage increment:', rollbackError);
      }
    }

    if (deviceUsageIncremented && deviceId) {
      try {
        await rollbackUsageIncrement(supabase, 'device', { userId: job.user_id, deviceId }, usagePeriodStart);
      } catch (rollbackError) {
        console.error('Failed to rollback device usage increment:', rollbackError);
      }
    }

    await finalizeJobFailure(supabase, jobId, message);

    return new Response(JSON.stringify({ error: message }), {
      headers: JSON_HEADERS,
      status: 500,
    });
  }
});

async function claimJobForProcessing(supabase: SupabaseClient, jobId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pdf_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), error_message: null })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  return Boolean(data);
}

async function finalizeJobFailure(supabase: SupabaseClient, jobId: string, message: string) {
  const { error } = await supabase
    .from('pdf_jobs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to record PDF job failure', { jobId, error });
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

  if (!existing) {
    console.warn('Usage rollback skipped: counter not found', {
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
      throw new Error(`Failed to load normalized usage counter for rollback: ${normalizedError.message}`);
    }

    if (!normalizedRow) {
      console.warn('Usage rollback skipped: period mismatch', {
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
      console.warn('Usage rollback skipped: period mismatch', {
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
    console.warn('Usage rollback skipped: non-positive counter', {
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
      if (attempt > 0) {
        console.log(`Rollback succeeded on attempt ${attempt + 1}`, { kind, target, expectedPeriod });
      }
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delayMs = 100 * Math.pow(2, attempt);
        console.warn(`Rollback attempt ${attempt + 1} failed, retrying in ${delayMs}ms`, {
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
  console.error(`Failed to rollback usage increment after ${maxRetries} attempts`, {
    kind,
    target,
    expectedPeriod,
    error: lastError?.message,
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
        }
      : {
          p_user_id: target.userId,
          p_device_id: (target as CounterTargets['device']).deviceId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
        };

  console.log('Calling quota increment RPC (edge worker)', {
    rpc: config.rpc,
    kind,
    target,
    limit: normalizedLimit,
    periodStart,
    payload: rpcPayload,
  });

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload as Record<string, unknown>);
  if (error) {
    const message = error.message ?? '';
    const details = error.details ?? '';
    const combined = `${message} ${details}`.toLowerCase();
    
    console.error('Quota increment RPC error (edge worker)', {
      rpc: config.rpc,
      kind,
      target,
      limit: normalizedLimit,
      periodStart,
      error: {
        message,
        details,
        code: (error as { code?: string }).code,
        hint: (error as { hint?: string }).hint,
      },
    });
    
    if (
      combined.includes(config.rpc) ||
      combined.includes('multiple function variants') ||
      combined.includes('could not find function')
    ) {
      console.warn('Falling back to non-RPC increment due to RPC function error (edge worker)', {
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
  
  console.log('Quota increment RPC result (edge worker)', {
    rpc: config.rpc,
    kind,
    target,
    result: incrementResult,
  });
  
  if (!incrementResult.allowed) {
    console.warn('Quota increment not allowed (edge worker)', {
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
