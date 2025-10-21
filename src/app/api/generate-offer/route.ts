import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
// Use shared pricing utilities and HTML template helpers.  The
// summarization and table HTML generation are centralised in
// `app/lib/pricing.ts`, and the full document template lives in
// `app/lib/htmlTemplate.ts`.
import { PriceRow, priceTableHtml } from '@/app/lib/pricing';
import { offerHtml } from '@/app/lib/htmlTemplate';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { v4 as uuid } from 'uuid';
import { Buffer } from 'buffer';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getCurrentUser, getUserProfile } from '@/lib/services/user';
import { getOrInitUsage, incrementOfferCount } from '@/lib/services/usage';

export const runtime = 'nodejs';

// System prompt for our OpenAI assistant.  See report for details on
// structure and style guidelines.
const SYSTEM_PROMPT = `
Te egy magyar üzleti ajánlatíró asszisztens vagy.
Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj.
Adj vissza TISZTA HTMLT (nincs külső CSS), csak címsorok, bekezdések és felsorolások.
Szerkezet: Bevezető, Projekt összefoglaló, Terjedelem, Szállítandók, Ütemezés, Feltételezések & Kizárások, Következő lépések, Zárás.
Nyelv: magyar, kivéve ha a bemenet kifejezetten angol.
Hangnem: professzionális, de barátságos.
Ne találj ki árakat; az árképzés külön jelenik meg az alkalmazásban.
`;

export async function POST(req: NextRequest) {
  try {
    // Parse and sanitize the incoming JSON body.  Sanitizing early
    // prevents any malicious scripts or HTML fragments from reaching
    // our AI prompts or being persisted in the database.
    const body = await req.json();
    const {
      title,
      industry,
      description,
      deadline,
      language = 'hu',
      brandVoice = 'friendly',
      style = 'detailed',
      prices = [],
      aiOverrideHtml,
      clientId,
    } = body as {
      title: string;
      industry: string;
      description: string;
      deadline?: string;
      language?: 'hu' | 'en';
      brandVoice?: 'friendly' | 'formal';
      style?: 'compact' | 'detailed';
      prices: PriceRow[];
      aiOverrideHtml?: string;
      clientId?: string;
    };

    // ---- Auth ----
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Auth required: hiányzik az Authorization: Bearer <token> fejléc' },
        { status: 401 }
      );
    }
    const access_token = authHeader.split(' ')[1];

    const sb = supabaseServer();
    // Use service helper to fetch current user or throw
    let user;
    try {
      user = await getCurrentUser(sb, access_token);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Invalid user' }, { status: 401 });
    }

    // ---- Limit (havi) ----

    // Fetch usage counter (initialize if missing) and profile info
    const { usage, isNewPeriod } = await getOrInitUsage(sb, user.id);
    const profile = await getUserProfile(sb, user.id);

    const plan = (profile?.plan as 'free' | 'starter' | 'pro' | undefined) ?? 'free';
    const limit = plan === 'pro' ? Number.POSITIVE_INFINITY : plan === 'starter' ? 20 : 5;

    const currentCount = isNewPeriod ? 0 : usage.offers_generated || 0;

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: 'Elérted a havi ajánlatlimitálást a csomagban.' },
        { status: 402 }
      );
    }

    // ---- AI szöveg (override elsőbbség) ----
    let aiHtml = '';
    if (aiOverrideHtml && aiOverrideHtml.trim().length > 0) {
      // Sanitize override HTML to strip scripts
      aiHtml = sanitizeHTML(aiOverrideHtml.trim());
    } else {
      // Check for OpenAI API key via typed env helper
      if (!envServer.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY hiányzik az .env.local fájlból.' },
          { status: 500 }
        );
      }
      const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

      const styleAddon =
        style === 'compact'
          ? 'Stílus: rövid, lényegretörő, 3–5 bekezdés és néhány felsorolás, sallang nélkül.'
          : 'Stílus: részletes, mégis jól tagolt; tömör bekezdések és áttekinthető felsorolások.';

      // Sanitize user inputs before passing to OpenAI
      const safeTitle = sanitizeInput(title);
      const safeIndustry = sanitizeInput(industry);
      const safeDescription = sanitizeInput(description);
      const safeDeadline = sanitizeInput(deadline || '—');
      const safeLanguage = sanitizeInput(language);
      const safeBrand = sanitizeInput(brandVoice);

      const userPrompt = `
Nyelv: ${safeLanguage}
Hangnem: ${safeBrand}
Iparág: ${safeIndustry}
Projekt leírás: ${safeDescription}
Határidő: ${safeDeadline}
${styleAddon}
Ne találj ki árakat, az árképzés külön jelenik meg.
`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
        });
        aiHtml = sanitizeHTML(
          completion.choices[0]?.message?.content?.trim() ?? '<p>(nincs tartalom)</p>'
        );
      } catch (e: any) {
        console.error('OpenAI error:', e?.message || e);
        return NextResponse.json(
          { error: 'OpenAI hívás sikertelen. Ellenőrizd az API-kulcsot.' },
          { status: 502 }
        );
      }
    }

    // ---- Ár tábla HTML ----
    const rows: PriceRow[] = prices || [];
    // Use shared price table HTML builder.  This returns a complete
    // `<table>` element including header, body and footer with totals.
    const priceTable = priceTableHtml(rows);

    // ---- PDF render ----
    const offerId = uuid();
    let pdfUrl: string | null = null;

    try {
      // Build the full HTML for PDF using sanitized pieces
      const html = offerHtml({
        title: sanitizeInput(title || 'Árajánlat'),
        companyName: sanitizeInput(profile?.company_name || ''),
        aiBodyHtml: aiHtml,
        priceTableHtml: priceTable,
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfData = await page.pdf({ format: 'A4', printBackground: true });
      const pdfBuffer = Buffer.from(pdfData);
      await browser.close();

      const path = `${user.id}/${offerId}.pdf`;
      const upload = await sb.storage.from('offers').upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (upload.error) {
        console.error('Storage upload error:', upload.error.message);
      } else {
        const { data: pub } = sb.storage.from('offers').getPublicUrl(path);
        pdfUrl = pub?.publicUrl || null;
      }
    } catch (e: any) {
      console.error('PDF error:', e?.message || e);
      // PDF hiba esetén is mentünk ajánlatot; a pdf_url null marad
    }

    // ---- Ajánlat mentése ----
    await sb.from('offers').insert({
      id: offerId,
      user_id: user.id,
      title: sanitizeInput(title),
      industry: sanitizeInput(industry),
      recipient_id: clientId || null,
      inputs: { description: sanitizeInput(description), deadline, language, brandVoice, style },
      ai_text: aiHtml,
      price_json: rows,
      pdf_url: pdfUrl,
      status: 'draft',
    });

    // ---- számláló frissítés ----
    // Atomically increment the usage counter via the service helper
    await incrementOfferCount(sb, user.id, currentCount, isNewPeriod);

    return NextResponse.json({
      ok: true,
      id: offerId,
      pdfUrl,
      note: pdfUrl ? undefined : 'PDF generálás kihagyva (ideiglenes).',
    });
  } catch (e: any) {
    console.error('Server error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}