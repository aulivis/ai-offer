/**
 * PDF Job Monitoring & Metrics
 *
 * Provides metrics and monitoring capabilities for PDF generation jobs.
 * Integrates with OpenTelemetry for observability.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

export interface PdfJobMetrics {
  queueDepth: {
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
  };
  processingTimes: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  failureRate: number;
  stuckJobs: number;
  retryRate: number;
}

/**
 * Gets current queue depth metrics
 */
export async function getQueueDepth(
  supabase: SupabaseClient,
): Promise<PdfJobMetrics['queueDepth']> {
  const { data, error } = await supabase
    .from('pdf_jobs')
    .select('status')
    .in('status', ['pending', 'processing', 'failed', 'dead_letter']);

  if (error) {
    throw new Error(`Failed to get queue depth: ${error.message}`);
  }

  const counts = {
    pending: 0,
    processing: 0,
    failed: 0,
    deadLetter: 0,
  };

  for (const job of data || []) {
    switch (job.status) {
      case 'pending':
        counts.pending++;
        break;
      case 'processing':
        counts.processing++;
        break;
      case 'failed':
        counts.failed++;
        break;
      case 'dead_letter':
        counts.deadLetter++;
        break;
    }
  }

  return counts;
}

/**
 * Gets processing time statistics for completed jobs in the last 24 hours
 */
export async function getProcessingTimeStats(
  supabase: SupabaseClient,
  hours: number = 24,
): Promise<PdfJobMetrics['processingTimes']> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await supabase
    .from('pdf_jobs')
    .select('processing_duration_ms, started_at, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', since.toISOString())
    .not('processing_duration_ms', 'is', null);

  if (error) {
    throw new Error(`Failed to get processing time stats: ${error.message}`);
  }

  const durations = (data || [])
    .map((job) => job.processing_duration_ms)
    .filter((d): d is number => typeof d === 'number')
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

  return { avg, p50, p95, p99 };
}

/**
 * Calculates failure rate for the last 24 hours
 */
export async function getFailureRate(
  supabase: SupabaseClient,
  hours: number = 24,
): Promise<number> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data: completed, error: completedError } = await supabase
    .from('pdf_jobs')
    .select('id')
    .eq('status', 'completed')
    .gte('completed_at', since.toISOString());

  if (completedError) {
    throw new Error(`Failed to get completed jobs: ${completedError.message}`);
  }

  const { data: failed, error: failedError } = await supabase
    .from('pdf_jobs')
    .select('id')
    .in('status', ['failed', 'dead_letter'])
    .gte('updated_at', since.toISOString());

  if (failedError) {
    throw new Error(`Failed to get failed jobs: ${failedError.message}`);
  }

  const total = (completed?.length || 0) + (failed?.length || 0);
  if (total === 0) {
    return 0;
  }

  return (failed?.length || 0) / total;
}

/**
 * Gets count of stuck jobs
 */
export async function getStuckJobsCount(
  supabase: SupabaseClient,
  timeoutMinutes: number = 10,
): Promise<number> {
  const { data, error } = await supabase.rpc('get_stuck_jobs', {
    timeout_minutes: timeoutMinutes,
  });

  if (error) {
    throw new Error(`Failed to get stuck jobs: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Calculates retry rate (percentage of jobs that required retries)
 */
export async function getRetryRate(supabase: SupabaseClient, hours: number = 24): Promise<number> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await supabase
    .from('pdf_jobs')
    .select('retry_count')
    .gte('created_at', since.toISOString())
    .in('status', ['completed', 'failed', 'dead_letter']);

  if (error) {
    throw new Error(`Failed to get retry stats: ${error.message}`);
  }

  const jobs = data || [];
  if (jobs.length === 0) {
    return 0;
  }

  const jobsWithRetries = jobs.filter((job) => (job.retry_count || 0) > 0).length;
  return jobsWithRetries / jobs.length;
}

/**
 * Gets comprehensive metrics for PDF jobs
 */
export async function getPdfJobMetrics(
  supabase: SupabaseClient,
  hours: number = 24,
): Promise<PdfJobMetrics> {
  const [queueDepth, processingTimes, failureRate, stuckJobsCount, retryRate] = await Promise.all([
    getQueueDepth(supabase),
    getProcessingTimeStats(supabase, hours),
    getFailureRate(supabase, hours),
    getStuckJobsCount(supabase),
    getRetryRate(supabase, hours),
  ]);

  return {
    queueDepth,
    processingTimes,
    failureRate,
    stuckJobs: stuckJobsCount,
    retryRate,
  };
}

/**
 * Records a metric to OpenTelemetry (if available)
 */
export function recordMetric(
  name: string,
  value: number,
  attributes: Record<string, string | number> = {},
): void {
  // Try to record via OpenTelemetry
  try {
    if (typeof process !== 'undefined' && process.env.OTEL_SDK_DISABLED !== 'true') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { metrics } = require('@opentelemetry/api');
      const meter = metrics.getMeter('pdf-jobs');
      const counter = meter.createCounter(name);
      counter.add(value, attributes);
    }
  } catch (_error) {
    // OpenTelemetry not available or not configured - silently fail
    // Metrics will still be available via getPdfJobMetrics()
  }
}

/**
 * Records PDF job completion metrics
 */
export function recordJobCompletion(
  durationMs: number,
  status: 'completed' | 'failed' | 'dead_letter',
  retryCount: number = 0,
  priority: number = 0,
): void {
  recordMetric('pdf.job.duration', durationMs, {
    status,
    retry_count: retryCount,
    priority,
  });

  recordMetric('pdf.job.count', 1, {
    status,
    had_retries: retryCount > 0 ? 'true' : 'false',
  });

  if (retryCount > 0) {
    recordMetric('pdf.job.retry.count', retryCount, { status });
  }
}

/**
 * Records queue depth metrics
 */
export function recordQueueDepth(metrics: PdfJobMetrics['queueDepth']): void {
  recordMetric('pdf.job.queue_depth', metrics.pending, { status: 'pending' });
  recordMetric('pdf.job.queue_depth', metrics.processing, { status: 'processing' });
  recordMetric('pdf.job.queue_depth', metrics.failed, { status: 'failed' });
  recordMetric('pdf.job.queue_depth', metrics.deadLetter, { status: 'dead_letter' });
}

/**
 * Records stuck jobs count
 */
export function recordStuckJobs(count: number): void {
  recordMetric('pdf.job.stuck', count);
}

/**
 * Exports metrics for Prometheus or other monitoring systems
 */
export async function exportMetrics(
  supabase: SupabaseClient,
  log: ReturnType<typeof createLogger>,
): Promise<void> {
  try {
    const metrics = await getPdfJobMetrics(supabase);

    // Record to OpenTelemetry
    recordQueueDepth(metrics.queueDepth);
    recordStuckJobs(metrics.stuckJobs);
    recordMetric('pdf.job.failure_rate', metrics.failureRate);
    recordMetric('pdf.job.retry_rate', metrics.retryRate);
    recordMetric('pdf.job.processing_time.avg', metrics.processingTimes.avg);
    recordMetric('pdf.job.processing_time.p95', metrics.processingTimes.p95);
    recordMetric('pdf.job.processing_time.p99', metrics.processingTimes.p99);

    log.info('PDF job metrics exported', metrics as unknown as Record<string, unknown>);
  } catch (error) {
    log.error('Failed to export PDF job metrics', error);
  }
}
