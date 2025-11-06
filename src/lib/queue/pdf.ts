// This module handles queuing of PDF generation jobs and ensures that the
// Supabase PostgREST schema cache is refreshed when the `pdf_jobs` table is not
// found.  It includes fallbacks for environments where the PostgREST helper
// functions might not exist.  The HTTP fallback uses the `public` profile to
// avoid PostgREST's PGRST106 error, and treats a 406 response as a successful
// refresh attempt【117825949492769†L145-L158】.

import type { SupabaseClient } from '@supabase/supabase-js';

import { envServer } from '@/env.server';
import { getOfferTemplateByLegacyId } from '@/app/pdf/templates/engineRegistry';
import type { TemplateId } from '@/app/pdf/templates/types';
import type { RuntimePdfPayload } from '../pdfRuntime';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';

export interface PdfJobMetadata {
  notes?: string[];
  requestedTemplateId?: string | null;
  requestedTemplateRaw?: string | null;
  enforcedTemplateId?: string | null;
  originalTemplateId?: string | null;
  planTier?: 'free' | 'premium';
  [key: string]: unknown;
}

export interface PdfJobInput {
  jobId: string;
  offerId: string;
  userId: string;
  storagePath: string;
  html: string;
  runtimeTemplate?: RuntimePdfPayload | null;
  callbackUrl?: string | null;
  usagePeriodStart: string;
  userLimit: number | null;
  deviceId?: string | null;
  deviceLimit?: number | null;
  templateId?: string | null;
  requestedTemplateId?: string | null;
  metadata?: PdfJobMetadata;
}

const FALLBACK_TEMPLATE_ID: TemplateId = 'free.minimal@1.0.0';

type PlanTier = 'free' | 'premium';

// Fragments used to detect specific error messages from Supabase/PostgREST.
const SCHEMA_CACHE_ERROR_FRAGMENT =
  "could not find the table 'public.pdf_jobs' in the schema cache";
const SCHEMA_CACHE_FUNCTION_MISSING_FRAGMENT = 'could not find the function';
const PGREST_SCHEMA_CACHE_RPC = 'pgrest_schema_cache_reload';
const PGREST_SCHEMA_CACHE_RPC_FRAGMENT = 'pgrest.schema_cache_reload';

function isRefreshFunctionMissing(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes(SCHEMA_CACHE_FUNCTION_MISSING_FRAGMENT) ||
    (normalized.includes('refresh_pdf_jobs_schema_cache') && normalized.includes('does not exist'))
  );
}

async function refreshSchemaCacheViaPostgrest(sb: SupabaseClient) {
  const { error } = await sb.rpc(PGREST_SCHEMA_CACHE_RPC);
  if (error) {
    const message = error.message || '';
    throw new Error(`Failed to refresh PostgREST schema cache: ${message}`);
  }
}

async function refreshSchemaCacheViaHttp() {
  // PostgREST only allows switching to schemas included in db-schemas.  If you
  // specify a schema that isn’t configured, PostgREST returns a PGRST106
  // (HTTP 406) error【117825949492769†L145-L158】.  To avoid this, we use the
  // "public" schema profile, which is always available on Supabase.  A 406
  // status is treated as success because the reload notification still
  // succeeds even if the profile is not accepted.
  const endpoint = `${envServer.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${PGREST_SCHEMA_CACHE_RPC}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Profile': 'public',
      'Accept-Profile': 'public',
      apikey: envServer.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${envServer.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  // A 406 response indicates that the schema is not allowed; treat it as OK.
  if (response.status === 406) {
    return;
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to refresh schema cache via HTTP (${response.status}): ${body}`);
  }
}

async function refreshPdfJobsSchemaCache(sb: SupabaseClient) {
  const { error } = await sb.rpc('refresh_pdf_jobs_schema_cache');
  if (error) {
    const message = error.message || '';
    if (isRefreshFunctionMissing(message)) {
      console.warn(
        'refresh_pdf_jobs_schema_cache RPC is missing; attempting PostgREST schema cache reload.',
      );
      try {
        await refreshSchemaCacheViaPostgrest(sb);
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        if (fallbackMessage.toLowerCase().includes(PGREST_SCHEMA_CACHE_RPC_FRAGMENT)) {
          console.warn(
            'pgrest.schema_cache_reload RPC is missing; attempting direct HTTP refresh.',
          );
          await refreshSchemaCacheViaHttp();
          return;
        }

        throw new Error(fallbackMessage);
      }

      return;
    }
    throw new Error(`Failed to refresh pdf_jobs schema cache: ${message}`);
  }
}

function isSchemaCacheError(message: string | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes(SCHEMA_CACHE_ERROR_FRAGMENT);
}

function normalizePlanTier(value: unknown): PlanTier {
  if (typeof value !== 'string') {
    return 'free';
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'free';
  }

  if (normalized === 'pro' || normalized === 'premium') {
    return 'premium';
  }

  return 'free';
}

async function resolvePlanTier(sb: SupabaseClient, userId: string): Promise<PlanTier> {
  try {
    const { data, error } = await sb.from('profiles').select('plan').eq('id', userId).maybeSingle();

    if (error) {
      console.warn('Failed to resolve user plan for PDF job.', {
        userId,
        error: error.message,
      });
      return 'free';
    }

    return normalizePlanTier(data?.plan);
  } catch (error) {
    console.warn('Unexpected error while resolving user plan for PDF job.', error);
    return 'free';
  }
}

function normalizeTemplateIdentifier(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mergeMetadata(
  base: PdfJobMetadata | undefined,
  updates: PdfJobMetadata | undefined,
): PdfJobMetadata | undefined {
  if (!base && !updates) {
    return undefined;
  }

  const merged: PdfJobMetadata = { ...(base ?? {}) };

  if (updates) {
    if (Array.isArray(updates.notes) && updates.notes.length > 0) {
      merged.notes = [...(merged.notes ?? []), ...updates.notes];
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'notes') {
        return;
      }

      if (value !== undefined) {
        merged[key] = value;
      }
    });
  }

  return merged;
}

function resolveTemplateForPlan(
  plan: PlanTier,
  job: PdfJobInput,
): { templateId: TemplateId; metadata: PdfJobMetadata } {
  const fallbackTemplate = getOfferTemplateByLegacyId(FALLBACK_TEMPLATE_ID);
  const requestedRaw = normalizeTemplateIdentifier(
    job.requestedTemplateId ?? job.templateId ?? null,
  );

  let requestedTemplate = fallbackTemplate;
  let requestedCanonicalId: string | null = null;
  const metadataNotes: string[] = [];

  if (requestedRaw) {
    try {
      requestedTemplate = getOfferTemplateByLegacyId(requestedRaw);
      requestedCanonicalId = requestedTemplate.id;
    } catch (error) {
      console.warn('Requested template is not registered; falling back to default.', {
        requestedTemplateId: requestedRaw,
        error: error instanceof Error ? error.message : String(error),
      });
      metadataNotes.push(
        `Requested template "${requestedRaw}" is not registered. Using "${fallbackTemplate.id}" instead.`,
      );
      requestedTemplate = fallbackTemplate;
    }
  }

  let resolvedTemplateId: TemplateId = requestedTemplate.id;

  if (plan === 'free' && requestedTemplate.tier === 'premium') {
    metadataNotes.push(
      `Requested template "${requestedTemplate.id}" requires a premium plan. Using "${fallbackTemplate.id}" instead.`,
    );
    resolvedTemplateId = fallbackTemplate.id;
  }

  const metadata: PdfJobMetadata = {
    planTier: plan,
    requestedTemplateRaw: requestedRaw,
    requestedTemplateId: requestedCanonicalId ?? requestedRaw,
    originalTemplateId: job.templateId ?? null,
    enforcedTemplateId: resolvedTemplateId,
  };

  if (metadataNotes.length > 0) {
    metadata.notes = metadataNotes;
  }

  return { templateId: resolvedTemplateId, metadata };
}

type PreparedPdfJob = PdfJobInput & { templateId: TemplateId; metadata?: PdfJobMetadata };

async function insertPdfJob(sb: SupabaseClient, job: PreparedPdfJob) {
  return sb.from('pdf_jobs').insert({
    id: job.jobId,
    offer_id: job.offerId,
    user_id: job.userId,
    storage_path: job.storagePath,
    status: 'pending',
    payload: {
      html: job.html,
      runtimeTemplate: job.runtimeTemplate ?? null,
      usagePeriodStart: job.usagePeriodStart,
      userLimit: job.userLimit,
      deviceId: job.deviceId ?? null,
      deviceLimit: job.deviceLimit ?? null,
      templateId: job.templateId,
      ...(job.metadata ? { metadata: job.metadata } : {}),
    },
    callback_url: job.callbackUrl ?? null,
    download_token: job.jobId,
  });
}

export async function enqueuePdfJob(sb: SupabaseClient, job: PdfJobInput): Promise<void> {
  try {
    assertPdfEngineHtml(job.html, 'Pdf job payload');

    const planTier = await resolvePlanTier(sb, job.userId);
    const { templateId, metadata } = resolveTemplateForPlan(planTier, job);
    const preparedJob: PreparedPdfJob = {
      ...job,
      templateId,
      metadata: mergeMetadata(job.metadata, metadata),
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { error } = await insertPdfJob(sb, preparedJob);

      if (!error) {
        return;
      }

      if (isSchemaCacheError(error.message) && attempt === 0) {
        await refreshPdfJobsSchemaCache(sb);
        // Allow the PostgREST (PGRST) schema cache to catch up before retrying.
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }

      throw new Error(error.message || 'Failed to enqueue PDF job');
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('PDF queue request was cancelled before it could be completed.');
      }

      if (error.message.toLowerCase().includes('abort')) {
        throw new Error('PDF queue request was aborted. Please try again.');
      }

      throw error;
    }

    throw new Error('An unknown error occurred while queueing the PDF job.');
  }
}

export async function dispatchPdfJob(sb: SupabaseClient, jobId: string): Promise<void> {
  try {
    const { error } = await sb.functions.invoke('pdf-worker', {
      body: { jobId },
    });

    if (error) {
      const message = error.message || 'Failed to dispatch PDF job';
      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('PDF worker dispatch was cancelled before it could be completed.');
      }

      if (error.message.toLowerCase().includes('abort')) {
        throw new Error('PDF worker dispatch was aborted. Please try again.');
      }

      throw error;
    }

    throw new Error('An unknown error occurred while dispatching the PDF job.');
  }
}

const PENDING_STATUSES = ['pending', 'processing'] as const;

type PendingJobFilters = {
  userId: string;
  periodStart: string;
  deviceId?: string | null;
};

export async function countPendingPdfJobs(
  sb: SupabaseClient,
  filters: PendingJobFilters,
): Promise<number> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let query = sb
      .from('pdf_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', filters.userId)
      .in('status', PENDING_STATUSES)
      .eq('payload->>usagePeriodStart', filters.periodStart);

    if (filters.deviceId) {
      query = query.eq('payload->>deviceId', filters.deviceId);
    }

    const { count, error } = await query;

    if (!error) {
      return count ?? 0;
    }

    lastError = new Error(`Failed to count pending PDF jobs: ${error.message}`);

    if (isSchemaCacheError(error.message) && attempt === 0) {
      await refreshPdfJobsSchemaCache(sb);
      // Allow the PostgREST (PGRST) schema cache to catch up before retrying.
      await new Promise((resolve) => setTimeout(resolve, 250));
      continue;
    }

    throw lastError;
  }

  throw lastError ?? new Error('Failed to count pending PDF jobs due to an unknown error.');
}
