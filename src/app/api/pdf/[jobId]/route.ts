import { NextResponse } from 'next/server';
import { z } from 'zod';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';

import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

export const runtime = 'nodejs';

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

const pdfJobIdParamsSchema = z.object({
  jobId: uuidSchema,
});

export const POST = withAuth(async (req: AuthenticatedNextRequest, { params }: RouteParams) => {
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
    return NextResponse.json({ error: 'Nem található a kért PDF feladat.' }, { status: 404 });
  }

  if (!job || job.user_id !== req.user.id) {
    return NextResponse.json({ error: 'Nem található a kért PDF feladat.' }, { status: 404 });
  }

  if (!job.pdf_url) {
    return NextResponse.json({ error: 'A PDF még nem készült el.' }, { status: 409 });
  }

  if (!job.callback_url) {
    return NextResponse.json(
      { error: 'Ehhez a feladathoz nincs webhook konfigurálva.' },
      { status: 400 },
    );
  }

  if (!isPdfWebhookUrlAllowed(job.callback_url)) {
    return NextResponse.json({ error: 'A webhook URL már nincs engedélyezve.' }, { status: 400 });
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
        log.warn('Webhook replay response read error', readError);
      }

      const truncatedBody =
        responseText && responseText.length > 500 ? `${responseText.slice(0, 500)}…` : responseText;

      log.error('Webhook replay failed', {
        status: response.status,
        statusText: response.statusText,
        body: truncatedBody,
      });

      return NextResponse.json({ error: 'A webhook hívása sikertelen volt.' }, { status: 502 });
    }
  } catch (callbackError) {
    log.error('Webhook replay error', callbackError);
    return NextResponse.json({ error: 'A webhook hívása sikertelen volt.' }, { status: 502 });
  } finally {
    clearTimeout(abortTimeout);
  }

  return NextResponse.json({ ok: true });
});
