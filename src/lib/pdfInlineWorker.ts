import type { SupabaseClient } from '@supabase/supabase-js';
import type { Page } from 'puppeteer';

import type { PdfJobInput } from '@/lib/queue/pdf';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { rollbackUsageIncrement } from '@/lib/services/usage';

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

  let rpcPayload: Record<string, unknown>;
  if (kind === 'user') {
    rpcPayload = {
      p_user_id: target.userId,
      p_limit: normalizedLimit,
      p_period_start: periodStart,
    };
  } else {
    const deviceTarget = target as CounterTargets['device'];
    rpcPayload = {
      p_user_id: deviceTarget.userId,
      p_device_id: deviceTarget.deviceId,
      p_limit: normalizedLimit,
      p_period_start: periodStart,
    };
  }

  const { data, error } = await supabase.rpc(config.rpc, rpcPayload);
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

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    let page: Page | null = null;

    try {
      page = await browser.newPage();
      page.setDefaultNavigationTimeout(60_000);
      page.setDefaultTimeout(60_000);
      await page.setContent(job.html, { waitUntil: 'networkidle0' });
      const pdfBinary = await page.pdf({
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
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.error('Failed to close Puppeteer page (inline worker):', closeError);
        }
      }

      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close Puppeteer browser (inline worker):', closeError);
      }
    }
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
