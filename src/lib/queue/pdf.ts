import type { SupabaseClient } from '@supabase/supabase-js';

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

export async function enqueuePdfJob(sb: SupabaseClient, job: PdfJobInput): Promise<void> {
  try {
    const { error } = await sb.from('pdf_jobs').insert({
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

    if (error) {
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
  if (error) {
    throw new Error(`Failed to count pending PDF jobs: ${error.message}`);
  }

  return count ?? 0;
}
