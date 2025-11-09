/**
 * Vercel-Native PDF Worker
 * 
 * This module provides PDF job processing using Vercel-native Puppeteer.
 * It processes PDF jobs directly in Vercel serverless functions without
 * requiring Supabase Edge Functions.
 * 
 * Industry Best Practices:
 * - Uses puppeteer-core + @sparticuz/chromium
 * - Processes jobs directly in Vercel
 * - Uploads PDFs to Supabase Storage
 * - Updates job status in database
 * - Supports webhook callbacks
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import { generatePdfVercelNativeWithTimeout } from './pdfVercelNative';
import { renderRuntimePdfHtml } from './pdfRuntime';
import type { PdfJobInput } from './queue/pdf';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { envServer } from '@/env.server';

const JOB_TIMEOUT_MS = 90_000;

/**
 * Processes a PDF job using Vercel-native Puppeteer
 * 
 * @param supabase - Supabase client (should use service role for system operations)
 * @param job - PDF job input
 * @returns PDF URL if successful, null if job was already processed
 */
export async function processPdfJobVercelNative(
  supabase: SupabaseClient,
  job: PdfJobInput,
): Promise<string | null> {
  // Check if job is already being processed or completed
  const { data: existingJob, error: fetchError } = await supabase
    .from('pdf_jobs')
    .select('status, pdf_url')
    .eq('id', job.jobId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to check job status: ${fetchError.message}`);
  }

  if (existingJob?.status === 'completed' && existingJob.pdf_url) {
    // Job already completed
    return existingJob.pdf_url;
  }

  if (existingJob?.status === 'failed') {
    throw new Error('PDF job was already processed and failed');
  }

  // Atomically claim the job by updating status from 'pending' to 'processing'
  // This prevents race conditions when multiple workers try to process the same job
  const { data: updateData, error: updateError } = await supabase
    .from('pdf_jobs')
    .update({ status: 'processing' })
    .eq('id', job.jobId)
    .eq('status', 'pending') // Only update if still pending (atomic check)
    .select('id')
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to claim job: ${updateError.message}`);
  }

  // If no rows were updated, job was already claimed by another worker
  if (!updateData) {
    // Check if job was completed by another worker
    const { data: checkJob } = await supabase
      .from('pdf_jobs')
      .select('status, pdf_url')
      .eq('id', job.jobId)
      .maybeSingle();
    
    if (checkJob?.status === 'completed' && checkJob.pdf_url) {
      return checkJob.pdf_url;
    }
    
    throw new Error('PDF job was already claimed by another worker');
  }

  let pdfBuffer: Buffer | null = null;

  try {
    // Render HTML from runtime template or use provided HTML
    let html = job.html;
    if (job.runtimeTemplate) {
      html = renderRuntimePdfHtml(job.runtimeTemplate);
    }

    // Generate PDF using Vercel-native Puppeteer
    pdfBuffer = await generatePdfVercelNativeWithTimeout(
      html,
      {
        metadata: {
          title: job.runtimeTemplate?.slots?.doc?.title || 'Offer Document',
          author: 'AI Offer Platform',
          subject: 'Business Offer',
          keywords: 'offer,business,proposal',
          creator: 'AI Offer Platform',
          producer: 'AI Offer Platform',
        },
      },
      JOB_TIMEOUT_MS,
    );

    // Upload PDF to Supabase Storage
    // Use the storage path from job, or generate one based on job ID
    const storagePath = job.storagePath || `${job.userId}/${job.jobId}.pdf`;
    
    // Convert Buffer to Uint8Array for Supabase Storage
    const pdfUint8 = Buffer.isBuffer(pdfBuffer) 
      ? new Uint8Array(pdfBuffer) 
      : pdfBuffer instanceof Uint8Array 
        ? pdfBuffer 
        : new Uint8Array(pdfBuffer);
    
    const pdfArrayBuffer = new ArrayBuffer(pdfUint8.byteLength);
    new Uint8Array(pdfArrayBuffer).set(pdfUint8);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('offers')
      .upload(storagePath, pdfArrayBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF to storage: ${uploadError.message}`);
    }

    // Get public URL for the PDF
    const { data: urlData } = supabase.storage
      .from('offers')
      .getPublicUrl(storagePath);

    const pdfUrl = urlData?.publicUrl;
    
    if (!pdfUrl) {
      throw new Error('Failed to get public URL for generated PDF');
    }

    // Update offer with PDF URL if offer exists (for internal jobs)
    // External API jobs may not require offer update, but we do it for consistency
    if (job.offerId) {
      const { error: offerUpdateError } = await supabase
        .from('offers')
        .update({ pdf_url: pdfUrl })
        .eq('id', job.offerId)
        .eq('user_id', job.userId);

      if (offerUpdateError) {
        // Log but don't fail - offer update is not critical for all job types
        console.warn(`Failed to update offer with PDF URL: ${offerUpdateError.message}`);
      }
    }

    // Update job status to completed
    const { error: completeError } = await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        pdf_url: pdfUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.jobId);

    if (completeError) {
      throw new Error(`Failed to update job status: ${completeError.message}`);
    }

    // Send webhook callback if configured
    if (job.callbackUrl) {
      try {
        const webhookResponse = await fetch(job.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: job.jobId,
            status: 'completed',
            pdfUrl,
            downloadUrl: `${envServer.APP_URL}/api/pdf/export/${job.jobId}/download?token=${job.jobId}`,
          }),
        });

        if (!webhookResponse.ok) {
          console.warn(`Webhook callback failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
        }
      } catch (webhookError) {
        // Don't fail the job if webhook fails
        console.error('Webhook callback error:', webhookError);
      }
    }

    return pdfUrl;
  } catch (error) {
    // Update job status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.jobId);

    // Send webhook callback if configured
    if (job.callbackUrl) {
      try {
        await fetch(job.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: job.jobId,
            status: 'failed',
            error: errorMessage,
          }),
        });
      } catch (webhookError) {
        // Ignore webhook errors
        console.error('Webhook callback error:', webhookError);
      }
    }

    throw error;
  }
}

