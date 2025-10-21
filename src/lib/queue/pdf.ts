import type { SupabaseClient } from '@supabase/supabase-js';

export interface PdfJobInput {
  jobId: string;
  offerId: string;
  userId: string;
  storagePath: string;
  html: string;
  callbackUrl?: string;
}

export async function enqueuePdfJob(sb: SupabaseClient, job: PdfJobInput): Promise<void> {
  const { error } = await sb.from('pdf_jobs').insert({
    id: job.jobId,
    offer_id: job.offerId,
    user_id: job.userId,
    storage_path: job.storagePath,
    status: 'pending',
    payload: { html: job.html },
    callback_url: job.callbackUrl ?? null,
    download_token: job.jobId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to enqueue PDF job');
  }
}
