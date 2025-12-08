import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandling } from '@/lib/errorHandling';
import { handleValidationError, HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { getExternalPdfDownloadUrl } from '@/lib/pdfExternalApi';
import { uuidSchema } from '@/lib/validation/schemas';

/**
 * GET /api/pdf/export/[jobId]/download
 *
 * Download a completed PDF.
 * This endpoint is public and does not require authentication.
 *
 * Optional query parameter: token - Download token for additional security
 */
export const runtime = 'nodejs';

const jobIdParamsSchema = z.object({
  jobId: uuidSchema,
});

const downloadQuerySchema = z.object({
  token: z.string().optional(),
});

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) => {
    const requestId = getRequestId(req);
    createLogger(requestId);

    const resolvedParams = await params;
    const parsedParams = jobIdParamsSchema.safeParse(resolvedParams);

    if (!parsedParams.success) {
      return handleValidationError(parsedParams.error, requestId);
    }

    const { jobId } = parsedParams.data;

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsedQuery = downloadQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return handleValidationError(parsedQuery.error, requestId);
    }

    const { token } = parsedQuery.data;

    // Get PDF download URL
    const pdfUrl = await getExternalPdfDownloadUrl(jobId, token);

    if (!pdfUrl) {
      return createErrorResponse(
        'PDF is not ready yet or job not found. Check the status endpoint to see the current job status.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Redirect to the PDF URL (Supabase Storage public URL)
    return NextResponse.redirect(pdfUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
);
