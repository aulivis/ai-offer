import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/errorHandling';
import { handleValidationError, HttpStatus, createErrorResponse } from '@/lib/errorHandling';
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

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);

    const resolvedParams = await params;
    const parsed = jobIdParamsSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      return handleValidationError(parsed.error, requestId);
    }

    const { jobId } = parsed.data;

    try {
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
        return createErrorResponse('PDF job not found', HttpStatus.NOT_FOUND);
      }

      throw error;
    }
  },
);
