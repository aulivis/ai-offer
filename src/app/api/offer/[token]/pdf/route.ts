import { NextResponse } from 'next/server';
import { supabaseAnonServer } from '@/app/lib/supabaseAnonServer';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { envServer } from '@/env.server';

type RouteParams = {
  params: Promise<{
    token?: string;
  }>;
};

/**
 * POST /api/offer/[token]/pdf
 * Generate PDF on-demand for a shared offer
 */
export async function POST(request: Request, context: RouteParams) {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);

  // Validate route parameters
  const resolvedParams = await context.params;
  const token = resolvedParams.token;

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  log.setContext({ token });

  try {
    const sb = await supabaseAnonServer();

    // Verify share exists and is active (quick validation)
    const { data: share, error: shareError } = await sb
      .from('offer_shares')
      .select('id, offer_id, expires_at')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link expired' }, { status: 403 });
    }

    // Build public offer URL with PDF parameter to hide interactive elements
    const publicOfferUrl = `${envServer.APP_URL}/offer/${token}?pdf=true`;

    // Generate PDF from the public HTML page (simpler, ensures consistency)
    const { default: puppeteer } = await import('puppeteer');

    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      // Navigate to the public offer page and wait for it to fully load
      await page.goto(publicOfferUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();

      log.info('PDF generated on-demand (public)', { offerId: share.offer_id, token });

      // Return PDF as buffer
      return new NextResponse(pdfBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="offer-${share.offer_id}.pdf"`,
        },
      });
    } catch (pdfError) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
      log.error('PDF generation failed', { error: pdfError, offerId: share.offer_id, token });
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
  } catch (error) {
    log.error('Unexpected error during PDF generation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
