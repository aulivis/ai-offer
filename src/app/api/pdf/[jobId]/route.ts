import { NextResponse } from 'next/server';
import { z } from 'zod';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { handleValidationError, HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { uuidSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

const pdfJobIdParamsSchema = z.object({
  jobId: uuidSchema,
});

export const POST = withAuth(
  withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest, { params }: RouteParams) => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id });

    // Validate route parameters
    const resolvedParams = await params;
    const parsed = pdfJobIdParamsSchema.safeParse(resolvedParams);
    if (!parsed.success) {
      return handleValidationError(parsed.error, requestId);
    }

    const jobId = parsed.data.jobId;

    const sb = await supabaseServer();
    const { data: job, error } = await sb
      .from('pdf_jobs')
      .select('id, user_id, offer_id, pdf_url, callback_url, download_token')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      log.error('PDF job lookup failed', error);
      throw error;
    }

    if (!job || job.user_id !== req.user.id) {
      return createErrorResponse('Nem található a kért PDF feladat.', HttpStatus.NOT_FOUND);
    }

    if (!job.pdf_url) {
      return createErrorResponse('A PDF még nem készült el.', HttpStatus.CONFLICT);
    }

    if (!job.callback_url) {
      return createErrorResponse(
        'Ehhez a feladathoz nincs webhook konfigurálva.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!isPdfWebhookUrlAllowed(job.callback_url)) {
      return createErrorResponse('A webhook URL már nincs engedélyezve.', HttpStatus.BAD_REQUEST);
    }

    const abortController = new AbortController();
    const abortTimeout = setTimeout(() => abortController.abort(), 10_000);

    try {
      const response = await fetch(job.callback_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          offerId: job.offer_id,
          pdfUrl: job.pdf_url,
          downloadToken: job.download_token,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let responseText: string | undefined;
        try {
          responseText = await response.text();
        } catch (readError) {
          log.warn('Webhook replay response read error', {
            error:
              readError instanceof Error
                ? { name: readError.name, message: readError.message }
                : String(readError),
          });
        }

        const truncatedBody =
          responseText && responseText.length > 500
            ? `${responseText.slice(0, 500)}…`
            : responseText;

        log.error('Webhook replay failed', {
          status: response.status,
          statusText: response.statusText,
          body: truncatedBody,
        });

        return createErrorResponse('A webhook hívása sikertelen volt.', HttpStatus.BAD_GATEWAY);
      }
    } catch (callbackError) {
      log.error('Webhook replay error', callbackError);
      throw callbackError;
    } finally {
      clearTimeout(abortTimeout);
    }

    return NextResponse.json({ ok: true });
  }),
);
