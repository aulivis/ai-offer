import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { getExternalPdfJobStatus } from '@/lib/pdfExternalApi';
import { uuidSchema } from '@/lib/validation/schemas';

/**
 * GET /api/pdf/export/[jobId]/status
 *
 * Get the status of a PDF generation job.
 * This endpoint is public and does not require authentication.
 */
export const runtime = 'nodejs';

const jobIdParamsSchema = z.object({
  jobId: uuidSchema,
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  try {
    const resolvedParams = await params;
    const parsed = jobIdParamsSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid job ID',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { jobId } = parsed.data;

    const status = await getExternalPdfJobStatus(jobId);

    return NextResponse.json({
      jobId,
      status: status.status,
      pdfUrl: status.pdfUrl,
      error: status.error,
      downloadUrl: status.downloadUrl,
    });
  } catch (error) {
    log.error('Failed to get PDF job status', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to get job status';

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          error: 'PDF job not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

