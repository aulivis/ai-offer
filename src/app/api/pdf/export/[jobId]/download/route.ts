import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  try {
    const resolvedParams = await params;
    const parsedParams = jobIdParamsSchema.safeParse(resolvedParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        {
          error: 'Invalid job ID',
          details: parsedParams.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { jobId } = parsedParams.data;

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsedQuery = downloadQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parsedQuery.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { token } = parsedQuery.data;

    // Get PDF download URL
    const pdfUrl = await getExternalPdfDownloadUrl(jobId, token);

    if (!pdfUrl) {
      return NextResponse.json(
        {
          error: 'PDF is not ready yet or job not found',
          hint: 'Check the status endpoint to see the current job status',
        },
        { status: 404 },
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
  } catch (error) {
    log.error('Failed to get PDF download URL', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to get PDF download URL';

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

