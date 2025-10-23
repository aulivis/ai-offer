// This module handles queuing of PDF generation jobs and ensures that the
// Supabase PostgREST schema cache is refreshed when the `pdf_jobs` table is not
// found.  It includes fallbacks for environments where the PostgREST helper
// functions might not exist.  The HTTP fallback uses the `public` profile to
// avoid PostgREST's PGRST106 error, and treats a 406 response as a successful
// refresh attempt【117825949492769†L145-L158】.

import type { SupabaseClient } from '@supabase/supabase-js';

import { envServer } from '@/env.server';

export interface PdfJobInput {
  jobId: string;
  offerId: string;
  userId: string;
  storagePath: string;
  html: string;
  callbackUrl?: string;
  usagePeriodStart: string;
  userLimit: number | null;
  deviceId?: string | null;
  deviceLimit?: number | null;
}

// Fragments used to detect specific error messages from Supabase/PostgREST.
const SCHEMA_CACHE_ERROR_FRAGMENT = "could not find the table 'public.pdf_jobs' in the schema cache";
const SCHEMA_CACHE_FUNCTION_MISSING_FRAGMENT = 'could not find the function';
const PGREST_SCHEMA_CACHE_RPC = 'pgrest.schema_cache_reload';
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
      console.warn('refresh_pdf_jobs_schema_cache RPC is missing; attempting PostgREST schema cache reload.');
      try {
        await refreshSchemaCacheViaPostgrest(sb);
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        if (fallbackMessage.toLowerCase().includes(PGREST_SCHEMA_CACHE_RPC_FRAGMENT)) {
          console.warn('pgrest.schema_cache_reload RPC is missing; attempting direct HTTP refresh.');
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

async function insertPdfJob(sb: SupabaseClient, job: PdfJobInput) {
  return sb.from('pdf_jobs').insert({
    id: job.jobId,
    offer_id: job.offerId,
    user_id: job.userId,
    storage_path: job.storagePath,
    status: 'pending',
    payload: {
      html: job.html,
      usagePeriodStart: job.usagePeriodStart,
      userLimit: job.userLimit,
      deviceId: job.deviceId ?? null,
      deviceLimit: job.deviceLimit ?? null,
    },
    callback_url: job.callbackUrl ?? null,
    download_token: job.jobId,
  });
}

export async function enqueuePdfJob(sb: SupabaseClient, job: PdfJobInput): Promise<void> {
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { error } = await insertPdfJob(sb, job);

      if (!error) {
        return;
      }

      if (isSchemaCacheError(error.message) && attempt === 0) {
        await refreshPdfJobsSchemaCache(sb);
        await new Promise((resolve) => setTimeout(resolve, 200));
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

const PENDING_STATUSES = ['pending', 'processing'] as const;

type PendingJobFilters = {
  userId: string;
  periodStart: string;
  deviceId?: string | null;
};

export async function countPendingPdfJobs(sb: SupabaseClient, filters: PendingJobFilters): Promise<number> {
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
      await new Promise((resolve) => setTimeout(resolve, 200));
      continue;
    }

    throw lastError;
  }

  throw lastError ?? new Error('Failed to count pending PDF jobs due to an unknown error.');
}
