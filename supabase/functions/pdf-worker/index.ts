import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = assertEnv(Deno.env.get('SUPABASE_URL'), 'SUPABASE_URL');
  const supabaseKey = assertEnv(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), 'SUPABASE_SERVICE_ROLE_KEY');

  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const jobId = body.jobId;
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId missing' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: job, error: jobError } = await supabase.from('pdf_jobs').select('*').eq('id', jobId).single();
  if (jobError || !job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 404,
    });
  }

  if (job.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Job already processed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 409,
    });
  }

  await supabase
    .from('pdf_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(job.payload.html, { waitUntil: 'networkidle0' });
    const pdfBinary = await page.pdf({ format: 'A4', printBackground: true });
    await page.close();
    await browser.close();

    const pdfBuffer = pdfBinary instanceof Uint8Array ? pdfBinary : new Uint8Array(pdfBinary);

    const upload = await supabase.storage.from('offers').upload(job.storage_path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const { data: publicUrlData } = supabase.storage.from('offers').getPublicUrl(job.storage_path);
    const pdfUrl = publicUrlData?.publicUrl ?? null;

    await supabase
      .from('offers')
      .update({ pdf_url: pdfUrl })
      .eq('id', job.offer_id)
      .eq('user_id', job.user_id);

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        pdf_url: pdfUrl,
      })
      .eq('id', jobId);

    if (job.callback_url && pdfUrl) {
      try {
        await fetch(job.callback_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            offerId: job.offer_id,
            pdfUrl,
            downloadToken: job.download_token,
          }),
        });
      } catch (callbackError) {
        console.error('Webhook error:', callbackError);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, jobId, offerId: job.offer_id, pdfUrl, downloadToken: job.download_token }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await supabase
      .from('pdf_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', jobId);

    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
