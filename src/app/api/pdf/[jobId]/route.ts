import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { isPdfWebhookUrlAllowed } from '@/lib/pdfWebhook';

import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

export const runtime = 'nodejs';

type RouteParams = {
  params: {
    jobId: string;
  };
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export const POST = withAuth(async (req: AuthenticatedNextRequest, { params }: RouteParams) => {
  const jobId = params.jobId?.trim();
  if (!jobId) {
    return badRequest('Hiányzik a PDF feladat azonosítója.');
  }

  const sb = supabaseServer();
  const { data: job, error } = await sb
    .from('pdf_jobs')
    .select('id, user_id, offer_id, pdf_url, callback_url, download_token')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    console.error('PDF job lookup failed:', error.message);
    return NextResponse.json({ error: 'Nem található a kért PDF feladat.' }, { status: 404 });
  }

  if (!job || job.user_id !== req.user.id) {
    return NextResponse.json({ error: 'Nem található a kért PDF feladat.' }, { status: 404 });
  }

  if (!job.pdf_url) {
    return NextResponse.json({ error: 'A PDF még nem készült el.' }, { status: 409 });
  }

  if (!job.callback_url) {
    return NextResponse.json({ error: 'Ehhez a feladathoz nincs webhook konfigurálva.' }, { status: 400 });
  }

  if (!isPdfWebhookUrlAllowed(job.callback_url)) {
    return NextResponse.json({ error: 'A webhook URL már nincs engedélyezve.' }, { status: 400 });
  }

  try {
    await fetch(job.callback_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        offerId: job.offer_id,
        pdfUrl: job.pdf_url,
        downloadToken: job.download_token,
      }),
    });
  } catch (callbackError) {
    console.error('Webhook replay error:', callbackError);
    return NextResponse.json({ error: 'A webhook hívása sikertelen volt.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
});
