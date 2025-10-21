import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { summarize, PriceRow } from '@/app/lib/pricing';
import { offerHtml } from '@/app/lib/htmlTemplate';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { v4 as uuid } from 'uuid';
import { Buffer } from 'buffer';

export const runtime = 'nodejs';

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
    const body = await req.json();
    const {
      title,
      industry,
      description,
      deadline,
      language = 'hu',
      brandVoice = 'friendly',
      style = 'detailed', // 'compact' | 'detailed'
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
    const { data: userData, error: getUserErr } = await sb.auth.getUser(access_token);
    if (getUserErr) {
      console.error('Supabase getUser error:', getUserErr.message || getUserErr);
      return NextResponse.json({ error: 'Auth failed: token ellenőrzés hibás' }, { status: 401 });
    }
    const user = userData?.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid user: érvénytelen token vagy más projekthez tartozik' },
        { status: 401 }
      );
    }

    // ---- Limit (havi) ----
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStr = monthStart.toISOString().slice(0, 10);

    let { data: usage } = await sb
      .from('usage_counters')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!usage) {
      await sb.from('usage_counters').insert({
        user_id: user.id, period_start: monthStr, offers_generated: 0
      });
      const res = await sb.from('usage_counters').select('*').eq('user_id', user.id).maybeSingle();
      usage = res.data || { user_id: user.id, period_start: monthStr, offers_generated: 0 };
    }

    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const plan = (profile?.plan as 'free' | 'starter' | 'pro' | undefined) ?? 'free';
    const limit = plan === 'pro' ? Number.POSITIVE_INFINITY : plan === 'starter' ? 20 : 5;

    const isNewMonth = usage.period_start !== monthStr;
    const currentCount = isNewMonth ? 0 : usage.offers_generated || 0;

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: 'Elérted a havi ajánlatlimitálást a csomagban.' },
        { status: 402 }
      );
    }

    // ---- AI szöveg (override elsőbbség) ----
    let aiHtml = '';
    if (aiOverrideHtml && aiOverrideHtml.trim().length > 0) {
      aiHtml = aiOverrideHtml.trim();
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY hiányzik az .env.local fájlból.' },
          { status: 500 }
        );
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const styleAddon =
        style === 'compact'
          ? 'Stílus: rövid, lényegretörő, 3–5 bekezdés és néhány felsorolás, sallang nélkül.'
          : 'Stílus: részletes, mégis jól tagolt; tömör bekezdések és áttekinthető felsorolások.';

      const userPrompt = `
Nyelv: ${language}
Hangnem: ${brandVoice}
Iparág: ${industry}
Projekt leírás: ${description}
Határidő: ${deadline || '—'}
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
        aiHtml = completion.choices[0]?.message?.content?.trim() ?? '<p>(nincs tartalom)</p>';
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
    const totals = summarize(rows);

    const priceTableHtml = `
      <table>
        <thead>
          <tr>
            <th>Tétel</th>
            <th>Mennyiség</th>
            <th>Egység</th>
            <th>Egységár (HUF)</th>
            <th>ÁFA %</th>
            <th>Összesen (nettó)</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.name || ''}</td>
              <td>${r.qty || 0}</td>
              <td>${r.unit || ''}</td>
              <td>${(r.unitPrice ?? 0).toLocaleString('hu-HU')}</td>
              <td>${r.vat ?? 0}</td>
              <td>${(((r.qty || 0) * (r.unitPrice || 0)) || 0).toLocaleString('hu-HU')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="5"><b>Nettó összesen</b></td><td><b>${totals.net.toLocaleString('hu-HU')} Ft</b></td></tr>
          <tr><td colspan="5">ÁFA</td><td>${totals.vat.toLocaleString('hu-HU')} Ft</td></tr>
          <tr><td colspan="5"><b>Bruttó összesen</b></td><td><b>${totals.gross.toLocaleString('hu-HU')} Ft</b></td></tr>
        </tfoot>
      </table>
    `;

    // ---- PDF render ----
    const offerId = uuid();
    let pdfUrl: string | null = null;

    try {
      const html = offerHtml({
        title: title || 'Árajánlat',
        companyName: profile?.company_name || '',
        aiBodyHtml: aiHtml,
        priceTableHtml,
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
      title,
      industry,
      recipient_id: clientId || null,
      inputs: { description, deadline, language, brandVoice, style },
      ai_text: aiHtml,
      price_json: rows,
      pdf_url: pdfUrl,
      status: 'draft',
    });

    // ---- számláló frissítés ----
    if (isNewMonth) {
      await sb.from('usage_counters').upsert({
        user_id: user.id, period_start: monthStr, offers_generated: 1
      });
    } else {
      await sb.from('usage_counters')
        .update({ offers_generated: currentCount + 1 })
        .eq('user_id', user.id);
    }

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
