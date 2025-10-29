import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
import {
  createPdfWebhookAllowlist,
  isPdfWebhookUrlAllowed,
  splitAllowlist,
} from '../../shared/pdfWebhook.ts';
import { assertPdfEngineHtml } from '../../shared/pdfHtmlSignature.ts';

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
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const jobId = body.jobId;
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId missing' }), {
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      status: 404,
    });
  }

  if (job.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Job already processed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 409,
    });
  }

  await supabase
    .from('pdf_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const payload = (job.payload ?? {}) as PdfJobPayload;
  const html = typeof payload.html === 'string' && payload.html ? payload.html : '';
  if (!html) {
    return new Response(JSON.stringify({ error: 'Job payload missing HTML' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  try {
    assertPdfEngineHtml(html, 'PDF job payload HTML');
  } catch (error) {
    await supabase
      .from('pdf_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', jobId);
    const message = error instanceof Error ? error.message : 'PDF job payload failed validation.';
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const usagePeriodStart = normalizeDate(
    typeof payload.usagePeriodStart === 'string' ? payload.usagePeriodStart : null,
    new Date(job.created_at ?? new Date()).toISOString().slice(0, 10),
  );
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
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
        });

        try {
          let page: Awaited<ReturnType<typeof browser.newPage>> | null = null;

          try {
            page = await browser.newPage();
            page.setDefaultNavigationTimeout(JOB_TIMEOUT_MS);
            page.setDefaultTimeout(JOB_TIMEOUT_MS);
            await page.setContent(html, { waitUntil: 'networkidle0' });
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

    const usageResult = await incrementUsage(
      supabase,
      'user',
      { userId: job.user_id },
      userLimit,
      usagePeriodStart,
    );
    if (!usageResult.allowed) {
      throw new Error('A havi ajánlatlimitálás túllépése miatt nem készíthető új PDF.');
    }
    userUsageIncremented = true;

    if (deviceId && deviceLimit !== null) {
      const deviceResult = await incrementUsage(
        supabase,
        'device',
        { userId: job.user_id, deviceId },
        deviceLimit,
        usagePeriodStart,
      );
      if (!deviceResult.allowed) {
        throw new Error('Az eszközön elérted a havi ajánlatlimitálást.');
      }
      deviceUsageIncremented = true;
    }

    await supabase
      .from('offers')
      .update({ pdf_url: pdfUrl })
      .eq('id', job.offer_id)
      .eq('user_id', job.user_id);

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pdf_url: pdfUrl,
      })
      .eq('id', jobId);

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
      { headers: { 'Content-Type': 'application/json' } },
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

    if (userUsageIncremented) {
      try {
        await rollbackUsageIncrement(supabase, 'user', { userId: job.user_id }, usagePeriodStart);
      } catch (rollbackError) {
        console.error('Failed to rollback user usage increment:', rollbackError);
      }
    }

    if (deviceUsageIncremented && deviceId) {
      try {
        await rollbackUsageIncrement(
          supabase,
          'device',
          { userId: job.user_id, deviceId },
          usagePeriodStart,
        );
      } catch (rollbackError) {
        console.error('Failed to rollback device usage increment:', rollbackError);
      }
    }

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', jobId);

    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
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

async function rollbackUsageIncrement<K extends CounterKind>(
  supabase: SupabaseClient,
  kind: K,
  target: CounterTargets[K],
  expectedPeriod: string,
) {
  const config = COUNTER_CONFIG[kind];
  let query = supabase.from(config.table).select('offers_generated, period_start');
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      query = query.eq(column, target[key]);
    },
  );

  const { data: existing, error } = await query.maybeSingle();
  if (error) {
    console.warn('Failed to load usage counter for rollback', error);
    return;
  }

  if (!existing) {
    return;
  }

  const currentCount = Number(existing.offers_generated ?? 0);
  if (currentCount <= 0) {
    return;
  }

  const periodStart = normalizeDate(existing.period_start, expectedPeriod);
  if (periodStart !== expectedPeriod) {
    return;
  }

  let updateBuilder = supabase.from(config.table).update({ offers_generated: currentCount - 1 });
  (Object.entries(config.columnMap) as [keyof CounterTargets[K], string][]).forEach(
    ([key, column]) => {
      updateBuilder = updateBuilder.eq(column, target[key]);
    },
  );

  const { error: updateError } = await updateBuilder;
  if (updateError) {
    console.warn('Failed to rollback usage counter increment', updateError);
  }
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

function normalizeDate(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return fallback;
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

async function incrementUsage<K extends CounterKind>(
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
          p_device_id: target.deviceId,
          p_limit: normalizedLimit,
          p_period_start: periodStart,
        };

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload as Record<string, unknown>);
  if (error) {
    const message = error.message ?? '';
    if (message.toLowerCase().includes(config.rpc)) {
      return fallbackIncrement(supabase, kind, target, normalizedLimit, periodStart);
    }
    throw new Error(`Failed to update usage counter: ${message}`);
  }

  const [result] = Array.isArray(data) ? data : [data];
  return {
    allowed: Boolean(result?.allowed),
    offersGenerated: Number(result?.offers_generated ?? 0),
    periodStart: String(result?.period_start ?? periodStart),
  };
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
