/**
 * External API PDF Generation Helper
 * 
 * This module provides utilities for handling PDF generation requests from external
 * API clients (SDK, integrations, etc.) that don't require user authentication.
 * 
 * Industry Best Practices:
 * - Uses Vercel-native Puppeteer for PDF generation (industry best practice)
 * - Falls back to Supabase Edge Functions if Vercel-native not available
 * - Implements async job queue pattern
 * - Supports webhook callbacks
 * - Provides job status polling
 * - Uses service role for system operations
 */

import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { enqueuePdfJob, dispatchPdfJob, type PdfJobInput } from '@/lib/queue/pdf';
import { assertPdfEngineHtml } from '@/lib/pdfHtmlSignature';
import { renderRuntimePdfHtml, type RuntimePdfPayload } from '@/lib/pdfRuntime';
import { envServer } from '@/env.server';
import { processPdfJobVercelNative } from '@/lib/pdfVercelWorker';

/**
 * System user ID for external API calls
 * This should be a dedicated system user created in the database
 * For production, set EXTERNAL_API_SYSTEM_USER_ID environment variable
 * with the UUID of a system user account
 * 
 * If not set, a placeholder UUID will be used. This will work but PDFs
 * will be associated with a non-existent user, which may cause issues
 * with RLS policies or user-based features.
 */
const EXTERNAL_API_SYSTEM_USER_ID =
  envServer.EXTERNAL_API_SYSTEM_USER_ID || '00000000-0000-0000-0000-000000000000';

/**
 * Creates a PDF job for external API requests
 * 
 * @param html - The HTML content to convert to PDF
 * @param runtimeTemplate - Optional runtime template payload
 * @param callbackUrl - Optional webhook URL to notify when PDF is ready
 * @returns Job ID and status endpoint URL
 */
/**
 * Creates a minimal offer record for external API PDF jobs
 * This is required because pdf_jobs table has a foreign key constraint on offer_id
 * 
 * Uses service_role to bypass RLS policies for system operations
 */
async function createExternalApiOffer(
  sb: SupabaseClient,
  offerId: string,
  title: string,
): Promise<void> {
  const { error } = await sb.from('offers').insert({
    id: offerId,
    user_id: EXTERNAL_API_SYSTEM_USER_ID,
    title,
    status: 'draft',
    // Minimal fields for external API - service_role bypasses RLS
    industry: null,
    recipient_id: null,
    inputs: {
      source: 'external-api',
    },
    ai_text: '', // Empty since this is just for PDF generation tracking
    price_json: [], // Empty price array
    pdf_url: null,
  });

  if (error) {
    // If offer already exists (shouldn't happen with UUID), that's okay
    const errorMsg = error.message.toLowerCase();
    if (!errorMsg.includes('duplicate') && !errorMsg.includes('unique')) {
      throw new Error(`Failed to create offer record: ${error.message}`);
    }
  }
}

export async function createExternalPdfJob(
  html: string,
  runtimeTemplate?: RuntimePdfPayload | null,
  callbackUrl?: string | null,
): Promise<{ jobId: string; statusUrl: string; downloadUrl: string }> {
  // Validate HTML - if using runtime template, render it first
  let finalHtml = html;
  if (runtimeTemplate) {
    finalHtml = renderRuntimePdfHtml(runtimeTemplate);
  }
  assertPdfEngineHtml(finalHtml, 'External API PDF job HTML');

  const sb = supabaseServiceRole();
  const jobId = randomUUID();
  const offerId = randomUUID();
  
  // Extract title from runtime template or use default
  const title = runtimeTemplate?.slots?.doc?.title || 'External API PDF Export';
  
  // Create a minimal offer record (required for foreign key constraint)
  await createExternalApiOffer(sb, offerId, title);
  
  // Generate storage path
  const storagePath = `external-api/${jobId}.pdf`;
  
  // Get current date for usage period
  const now = new Date();
  const usagePeriodStart = now.toISOString().slice(0, 10); // YYYY-MM-DD format

  // Create PDF job input
  const pdfJobInput: PdfJobInput = {
    jobId,
    offerId,
    userId: EXTERNAL_API_SYSTEM_USER_ID,
    storagePath,
    html: finalHtml,
    runtimeTemplate: runtimeTemplate ?? null,
    callbackUrl: callbackUrl ?? null,
    usagePeriodStart,
    userLimit: null, // No limit for external API (or configure as needed)
    deviceId: null,
    deviceLimit: null,
    templateId: runtimeTemplate?.templateId ?? null,
    requestedTemplateId: runtimeTemplate?.templateId ?? null,
    metadata: {
      source: 'external-api',
      planTier: 'premium', // External API uses premium templates
    },
  };

  // Enqueue the PDF job
  await enqueuePdfJob(sb, pdfJobInput);

  // Check if we're in a Vercel environment and should use Vercel-native processing
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  const useVercelNative = isVercel && process.env.USE_VERCEL_NATIVE_PDF !== 'false';

  if (useVercelNative) {
    // Process PDF job using Vercel-native Puppeteer (industry best practice)
    // This runs directly in Vercel serverless functions without external dependencies
    // Process asynchronously so we can return the job ID immediately
    // The job will be processed in the background within the same function execution
    processPdfJobVercelNative(sb, pdfJobInput).catch((error) => {
      console.error('Vercel-native PDF generation failed:', error);
      // Job status will be updated to 'failed' in the worker
      // If processing fails, we could fall back to Supabase Edge Function here
      // For now, we let it fail and the client can check the job status
    });
    // Don't await - return immediately so client can poll for status
    // The job will continue processing in the background
  } else {
    // Use Supabase Edge Function (fallback or when explicitly disabled)
    await dispatchPdfJob(sb, jobId);
  }

  // Build URLs
  const baseUrl = envServer.APP_URL;
  const statusUrl = `${baseUrl}/api/pdf/export/${jobId}/status`;
  const downloadUrl = `${baseUrl}/api/pdf/export/${jobId}/download`;

  return {
    jobId,
    statusUrl,
    downloadUrl,
  };
}

/**
 * Gets the status of a PDF job
 * 
 * @param jobId - The job ID
 * @returns Job status and PDF URL if completed
 */
export async function getExternalPdfJobStatus(
  jobId: string,
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl?: string | null;
  error?: string | null;
  downloadUrl?: string;
}> {
  const sb = supabaseServiceRole();

  const { data: job, error } = await sb
    .from('pdf_jobs')
    .select('status, pdf_url, error_message, download_token')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !job) {
    throw new Error('PDF job not found');
  }

  const baseUrl = envServer.APP_URL;
  const downloadUrl: string | undefined = job.pdf_url
    ? `${baseUrl}/api/pdf/export/${jobId}/download?token=${job.download_token}`
    : undefined;

  const result: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    pdfUrl?: string | null;
    error?: string | null;
    downloadUrl?: string;
  } = {
    status: job.status as 'pending' | 'processing' | 'completed' | 'failed',
    pdfUrl: job.pdf_url,
    error: job.error_message,
  };
  
  if (downloadUrl) {
    result.downloadUrl = downloadUrl;
  }
  
  return result;
}

/**
 * Gets the PDF download URL for a completed job
 * 
 * @param jobId - The job ID
 * @param token - Optional download token for security
 * @returns PDF URL or null if not ready
 */
export async function getExternalPdfDownloadUrl(
  jobId: string,
  token?: string,
): Promise<string | null> {
  const sb = supabaseServiceRole();

  let query = sb
    .from('pdf_jobs')
    .select('pdf_url, download_token, status')
    .eq('id', jobId);

  // If token is provided, validate it
  if (token) {
    query = query.eq('download_token', token);
  }

  const { data: job, error } = await query.maybeSingle();

  if (error || !job) {
    return null;
  }

  // Only return URL if job is completed
  if (job.status !== 'completed' || !job.pdf_url) {
    return null;
  }

  return job.pdf_url;
}

